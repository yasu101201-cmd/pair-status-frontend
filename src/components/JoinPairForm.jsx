import { useState } from "react";
import { joinPair } from "../api/pairApi";

export default function JoinPairForm({ onJoined }) {
  const [code, setCode] = useState("");

  const handleJoin = async () => {
    await joinPair(code);
    onJoined();
  };

  return (
    <div>
      <input
        placeholder="参加コード"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button onClick={handleJoin}>参加</button>
    </div>
  );
}
