"""
Snowflake database service for storing debate summaries and analysis results.
"""
import os
import json
from datetime import datetime
from typing import Dict, List, Optional, Any

try:
    import snowflake.connector
    from snowflake.connector import DictCursor
    SNOWFLAKE_AVAILABLE = True
except ImportError:
    SNOWFLAKE_AVAILABLE = False
    print("Warning: snowflake-connector-python not installed. Database features disabled.")


class SnowflakeService:
    """Service for managing debate data in Snowflake database."""
    
    def __init__(self):
        """Initialize Snowflake connection from environment variables."""
        if not SNOWFLAKE_AVAILABLE:
            self.conn = None
            return
            
        self.account = os.getenv('SNOWFLAKE_ACCOUNT')
        self.user = os.getenv('SNOWFLAKE_USER')
        self.password = os.getenv('SNOWFLAKE_PASSWORD')
        self.warehouse = os.getenv('SNOWFLAKE_WAREHOUSE', 'COMPUTE_WH')
        self.database = os.getenv('SNOWFLAKE_DATABASE', 'LIBRA_DB')
        self.schema = os.getenv('SNOWFLAKE_SCHEMA', 'PUBLIC')
        self.conn = None
        
        # Validate required environment variables
        if not all([self.account, self.user, self.password]):
            print("Warning: Snowflake credentials not fully configured. Set SNOWFLAKE_ACCOUNT, SNOWFLAKE_USER, and SNOWFLAKE_PASSWORD")
    
    def get_connection(self):
        """Get or create Snowflake connection."""
        if not SNOWFLAKE_AVAILABLE:
            raise RuntimeError("Snowflake connector not installed. Run: pip install snowflake-connector-python")
            
        if not all([self.account, self.user, self.password]):
            raise ValueError("Snowflake credentials not configured in .env file")
        
        if self.conn is None or self.conn.is_closed():
            self.conn = snowflake.connector.connect(
                account=self.account,
                user=self.user,
                password=self.password,
                warehouse=self.warehouse,
                database=self.database,
                schema=self.schema
            )
        return self.conn
    
    def close_connection(self):
        """Close the Snowflake connection."""
        if self.conn and not self.conn.is_closed():
            self.conn.close()
    
    def init_schema(self):
        """Initialize database schema for storing debates."""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            # Create database if it doesn't exist
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {self.database}")
            cursor.execute(f"USE DATABASE {self.database}")
            cursor.execute(f"CREATE SCHEMA IF NOT EXISTS {self.schema}")
            cursor.execute(f"USE SCHEMA {self.schema}")
            
            # Create debates table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS debates (
                    debate_id VARCHAR(100) PRIMARY KEY,
                    topic VARCHAR(500),
                    speaker_a VARCHAR(200),
                    speaker_b VARCHAR(200),
                    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
                    total_turns INTEGER,
                    status VARCHAR(50) DEFAULT 'completed',
                    summary TEXT
                )
            """)
            
            # Create turns table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS debate_turns (
                    turn_id VARCHAR(100) PRIMARY KEY,
                    debate_id VARCHAR(100),
                    turn_number INTEGER,
                    speaker VARCHAR(10),
                    transcript TEXT,
                    duration_seconds INTEGER,
                    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
                    FOREIGN KEY (debate_id) REFERENCES debates(debate_id)
                )
            """)
            
            # Create fallacies table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS fallacies (
                    fallacy_id VARCHAR(100) PRIMARY KEY,
                    turn_id VARCHAR(100),
                    fallacy_type VARCHAR(100),
                    explanation TEXT,
                    text_segment TEXT,
                    confidence FLOAT,
                    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
                    FOREIGN KEY (turn_id) REFERENCES debate_turns(turn_id)
                )
            """)
            
            # Create fact checks table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS fact_checks (
                    fact_check_id VARCHAR(100) PRIMARY KEY,
                    turn_id VARCHAR(100),
                    claim TEXT,
                    verdict VARCHAR(50),
                    explanation TEXT,
                    confidence FLOAT,
                    sources VARIANT,
                    created_at TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
                    FOREIGN KEY (turn_id) REFERENCES debate_turns(turn_id)
                )
            """)
            
            conn.commit()
            print("✅ Snowflake schema initialized successfully")
            
        except Exception as e:
            print(f"❌ Error initializing schema: {e}")
            conn.rollback()
            raise
        finally:
            cursor.close()
    
    def save_debate_summary(self, debate_data: Dict[str, Any]) -> bool:
        """
        Save a complete debate summary to Snowflake.
        
        Args:
            debate_data: Dictionary containing debate information:
                - debate_id: Unique identifier
                - topic: Debate topic
                - speaker_a: Name of speaker A
                - speaker_b: Name of speaker B
                - turns: List of turn data
                - summary: Overall debate summary
                
        Returns:
            True if successful, False otherwise
        """
        conn = self.get_connection()
        cursor = conn.cursor()
        
        try:
            # Ensure we're using the right database and schema
            cursor.execute(f"USE DATABASE {self.database}")
            cursor.execute(f"USE SCHEMA {self.schema}")
            # Insert debate record
            cursor.execute("""
                INSERT INTO debates (
                    debate_id, topic, speaker_a, speaker_b, 
                    total_turns, summary
                )
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (
                debate_data.get('debate_id'),
                debate_data.get('topic', 'No topic'),
                debate_data.get('speaker_a', 'Speaker A'),
                debate_data.get('speaker_b', 'Speaker B'),
                len(debate_data.get('turns', [])),
                debate_data.get('summary', '')
            ))
            
            # Insert turns and their analysis
            for turn in debate_data.get('turns', []):
                turn_id = turn.get('turn_id') or f"{debate_data['debate_id']}_turn_{turn.get('turn_number')}"
                
                # Insert turn
                cursor.execute("""
                    INSERT INTO debate_turns (
                        turn_id, debate_id, turn_number, speaker, 
                        transcript, duration_seconds
                    )
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (
                    turn_id,
                    debate_data.get('debate_id'),
                    turn.get('turn_number'),
                    turn.get('speaker'),
                    turn.get('transcript'),
                    turn.get('duration', 0)
                ))
                
                # Insert fallacies for this turn
                for fallacy in turn.get('fallacies', []):
                    fallacy_id = fallacy.get('id') or f"{turn_id}_fallacy_{hash(fallacy.get('type'))}"
                    cursor.execute("""
                        INSERT INTO fallacies (
                            fallacy_id, turn_id, fallacy_type, 
                            explanation, text_segment, confidence
                        )
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (
                        fallacy_id,
                        turn_id,
                        fallacy.get('type'),
                        fallacy.get('explanation'),
                        fallacy.get('text_segment', ''),
                        fallacy.get('confidence', 0.0)
                    ))
                
                # Insert fact checks for this turn
                for fact_check in turn.get('fact_checks', []):
                    fact_check_id = fact_check.get('id') or f"{turn_id}_fact_{hash(fact_check.get('claim'))}"
                    sources = fact_check.get('sources')
                    
                    # Handle None/null sources properly
                    if sources is None or sources == []:
                        sources_json = '[]'
                    else:
                        sources_json = json.dumps(sources)
                    
                    cursor.execute("""
                        INSERT INTO fact_checks (
                            fact_check_id, turn_id, claim, verdict, 
                            explanation, confidence, sources
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, PARSE_JSON(%s))
                    """, (
                        fact_check_id,
                        turn_id,
                        fact_check.get('claim'),
                        fact_check.get('verdict'),
                        fact_check.get('explanation'),
                        fact_check.get('confidence', 0.0),
                        sources_json
                    ))
            
            conn.commit()
            print(f"✅ Debate {debate_data.get('debate_id')} saved to Snowflake")
            return True
            
        except Exception as e:
            print(f"❌ Error saving debate: {e}")
            conn.rollback()
            raise
        finally:
            cursor.close()
    
    def get_debate_summary(self, debate_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a debate summary from Snowflake.
        
        Args:
            debate_id: Unique debate identifier
            
        Returns:
            Dictionary with debate data or None if not found
        """
        conn = self.get_connection()
        cursor = conn.cursor(DictCursor)
        
        try:
            # Ensure we're using the right database and schema
            cursor.execute(f"USE DATABASE {self.database}")
            cursor.execute(f"USE SCHEMA {self.schema}")
            
            # Get debate info
            cursor.execute("""
                SELECT * FROM debates WHERE debate_id = %s
            """, (debate_id,))
            
            debate = cursor.fetchone()
            if not debate:
                return None
            
            # Get turns
            cursor.execute("""
                SELECT * FROM debate_turns 
                WHERE debate_id = %s 
                ORDER BY turn_number
            """, (debate_id,))
            
            turns = cursor.fetchall()
            
            # Get fallacies and fact checks for each turn
            for turn in turns:
                turn_id = turn['TURN_ID']
                
                cursor.execute("""
                    SELECT * FROM fallacies WHERE turn_id = %s
                """, (turn_id,))
                fallacies_raw = cursor.fetchall()
                
                # Transform fallacies to match frontend format
                turn['FALLACIES'] = [
                    {
                        'type': f.get('FALLACY_TYPE', ''),
                        'severity': 'medium',  # Default severity if not stored
                        'explanation': f.get('EXPLANATION', ''),
                        'quote': f.get('TEXT_SEGMENT', '')
                    }
                    for f in fallacies_raw
                ]
                
                cursor.execute("""
                    SELECT * FROM fact_checks WHERE turn_id = %s
                """, (turn_id,))
                turn['fact_checks'] = cursor.fetchall()
            
            debate['turns'] = turns
            return debate
            
        except Exception as e:
            print(f"❌ Error retrieving debate: {e}")
            raise
        finally:
            cursor.close()
    
    def list_debates(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        List recent debates.
        
        Args:
            limit: Maximum number of debates to return
            
        Returns:
            List of debate summaries
        """
        conn = self.get_connection()
        cursor = conn.cursor(DictCursor)
        
        try:
            # Ensure we're using the right database and schema
            cursor.execute(f"USE DATABASE {self.database}")
            cursor.execute(f"USE SCHEMA {self.schema}")
            
            cursor.execute("""
                SELECT 
                    debate_id, topic, speaker_a, speaker_b, 
                    created_at, total_turns, status, summary
                FROM debates 
                ORDER BY created_at DESC 
                LIMIT %s
            """, (limit,))
            
            return cursor.fetchall()
            
        except Exception as e:
            print(f"❌ Error listing debates: {e}")
            raise
        finally:
            cursor.close()


# Singleton instance
_snowflake_service = None

def get_snowflake_service() -> SnowflakeService:
    """Get or create the Snowflake service singleton."""
    global _snowflake_service
    if _snowflake_service is None:
        _snowflake_service = SnowflakeService()
    return _snowflake_service
