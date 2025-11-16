# When you pull this repo, run this
```bash
cd backend


# MAC
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cd frontend
npm install

#WINDOWS
python -m venv venv
venv\Scripts\activate.bat
pip install -r requirements.txt

cd frontend
npm install
```

# Get VSCODE to recognize the venv
then in vscode, do cmd + shift + p (or ctrl for windows Don and Sierra)
Type "Python: Select Interpreter" and select "Select interpreter path"

then choose:
```bash
#MAC
backend/venv/bin/python

#WINDOWS
backend\venv\bin\python.exe
```

# Run the app
## Backend
```bash
cd backend
source venv/bin/activate
python app.py
```
## Update your frontend adress
When you run the backend, its gonna say "Running on http:......." copy the adress and paste it into frontend/App.js on the line that's like "fetch("http://........")"

## Frontend
```bash
cd frontend
npm start
```

## Open the app
Scan the QR code with your phone after downloading Expo Go from app store

### It said this when I ran npx create-expo-app frontend
```bash
✅ Your project is ready!

To run your project, navigate to the directory and run one of the following npm commands.

- cd frontend
- npm run android
- npm run ios
- npm run web
```