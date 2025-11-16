from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route("/api/hello")
def hello():
    return jsonify({"message": "Hello from Flask!"})

if __name__ == "__main__":
    # Listen on all network interfaces so your phone can reach it
    # Set port explicitly to 5000
    app.run(host="0.0.0.0", port=5001, debug=True)

