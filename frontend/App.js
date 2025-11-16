import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://10.112.36.88:5001/api/hello") // PASTE YOUR IP ADDRESS IN THE QUOTES HERE ( KEEP /api/hello)
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(console.error);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>{message}</Text>
    </View>
  );
}
