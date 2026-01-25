import { createPair } from "../api/pairApi";

export default function CreatePairButton({ onCreated }) {
  const handleCreate = async () => {
    await createPair();
    onCreated();
  };

  return <button onClick={handleCreate}>ペアを作る</button>;
}
