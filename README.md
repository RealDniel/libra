# When you pull this repo, run this
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

# Get VSCODE to recognize the venv
then in vscode, do cmd + shift + p (or ctrl for windows Don and Sierra)
Type "Python: Select Interpreter" and select it

then choose:
```bash
backend/venv/bin/python (MAC)
backend\venv\bin\python.exe (WINDOWS)
```

# Run the app
## Backend
```bash
cd backend
source venv/bin/activate
python app.py
```

## Frontend
```bash
cd frontend
npm start
```
or

```bash
expo start
```

### It said this when I ran npx create-expo-app frontend
```bash
✅ Your project is ready!

To run your project, navigate to the directory and run one of the following npm commands.

- cd frontend
- npm run android
- npm run ios
- npm run web
```