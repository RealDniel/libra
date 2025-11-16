"""
Test script to check if debate retrieval works correctly
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from services.snowflake_service import get_snowflake_service
import json

def test_debate_retrieval():
    print("\n" + "="*60)
    print("Testing Debate Retrieval")
    print("="*60 + "\n")
    
    try:
        db_service = get_snowflake_service()
        
        # First, list debates to get an ID
        print("📋 Fetching list of debates...")
        debates = db_service.list_debates(limit=5)
        
        if not debates:
            print("❌ No debates found in database")
            print("\nTo test this feature:")
            print("1. Run a debate session in the app")
            print("2. Make sure it saves to the database")
            print("3. Run this script again")
            return
        
        print(f"✅ Found {len(debates)} debate(s)\n")
        
        # Get the first debate's full details
        first_debate = debates[0]
        debate_id = first_debate.get('DEBATE_ID')
        
        print(f"📖 Fetching full details for debate: {debate_id}")
        print(f"   Topic: {first_debate.get('TOPIC', 'N/A')}")
        print(f"   Turns: {first_debate.get('TOTAL_TURNS', 0)}\n")
        
        full_debate = db_service.get_debate_summary(debate_id)
        
        if not full_debate:
            print("❌ Could not retrieve full debate details")
            return
        
        print("="*60)
        print("FULL DEBATE DATA")
        print("="*60)
        print(json.dumps(full_debate, indent=2, default=str))
        print("\n")
        
        # Check turns
        turns = full_debate.get('turns', [])
        print(f"\n📝 TURNS: {len(turns)} found")
        
        if turns:
            print("\nFirst turn preview:")
            first_turn = turns[0]
            print(f"  Turn Number: {first_turn.get('TURN_NUMBER')}")
            print(f"  Speaker: {first_turn.get('SPEAKER')}")
            print(f"  Transcript: {first_turn.get('TRANSCRIPT', '')[:100]}...")
            print(f"  Fallacies: {len(first_turn.get('FALLACIES', []))}")
        else:
            print("⚠️  No turns found in debate")
        
        print("\n" + "="*60)
        print("✅ Test complete!")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_debate_retrieval()
