"""
Quick script to check if debates are stored in the database.
Run this to see all saved debates.
"""

try:
    from dotenv import load_dotenv
    load_dotenv()
except:
    pass

from services.snowflake_service import get_snowflake_service

def check_database():
    """Check and display all saved debates."""
    try:
        print("\n" + "="*60)
        print("Checking Snowflake Database for Saved Debates")
        print("="*60 + "\n")
        
        db_service = get_snowflake_service()
        
        # Initialize schema if needed
        print("📋 Initializing database schema (if needed)...")
        try:
            db_service.init_schema()
        except Exception as e:
            print(f"⚠️  Schema initialization: {e}")
        
        # List all debates
        print("\n📚 Fetching saved debates...")
        debates = db_service.list_debates(limit=50)
        
        if not debates:
            print("\n❌ No debates found in database.")
            print("   Debates will be saved automatically when you end a debate session.")
            return
        
        print(f"\n✅ Found {len(debates)} debate(s):\n")
        
        for i, debate in enumerate(debates, 1):
            debate_id = debate.get('DEBATE_ID', 'unknown')
            topic = debate.get('TOPIC', 'No topic')
            speaker_a = debate.get('SPEAKER_A', 'Speaker A')
            speaker_b = debate.get('SPEAKER_B', 'Speaker B')
            turns = debate.get('TOTAL_TURNS', 0)
            created = debate.get('CREATED_AT', 'Unknown')
            
            print(f"{i}. Debate ID: {debate_id}")
            print(f"   Topic: {topic}")
            print(f"   Speakers: {speaker_a} vs {speaker_b}")
            print(f"   Turns: {turns}")
            print(f"   Created: {created}")
            print()
        
        print("="*60)
        print(f"Total debates in database: {len(debates)}")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error checking database: {e}")
        print("\nMake sure you have:")
        print("1. Snowflake credentials configured in .env file")
        print("2. snowflake-connector-python installed: pip install snowflake-connector-python")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_database()
