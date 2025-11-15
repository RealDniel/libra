# When you pull this repo, run this
```bash
# MAC
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

#WINDOWS
python -m venv venv
venv\Scripts\activate.bat
pip install -r backend\requirements.txt
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
First, you need to get your laptop's IP adress and paste it into frontend/App.js on the line that's like "fetch("http://........")"
## Get ip adress :
```bash
# MAC
ifconfig | grep "inet "

#Then choose the one that looks like an IP address, should be second line 10.112.idk


#WINDOWS
ipconfig

#Then get ipv4 address
```
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