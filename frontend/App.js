import React, { useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://192.0.0.2:5001/api/hello") // PASTE YOUR IP ADDRESS IN THE QUOTES HERE
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
