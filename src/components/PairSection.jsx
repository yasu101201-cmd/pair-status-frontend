import CreatePairButton from "./CreatePairButton";
import JoinPairForm from "./JoinPairForm";

export default function PairSection({ pairStatus, onUpdated }) {
  if (pairStatus.state === "NONE") {
    return (
      <>
        <h2>ペア未作成</h2>
        <CreatePairButton onCreated={onUpdated} />
        <JoinPairForm onJoined={onUpdated} />
      </>
    );
  }

  if (pairStatus.state === "WAITING") {
    return (
      <>
        <h2>相手待ち</h2>
        <p>
          参加コード：<b>{pairStatus.joinCode}</b>
        </p>
      </>
    );
  }

  if (pairStatus.state === "PAIRED") {
    return (
      <>
        <h2>ペア成立！</h2>
        <p>相手と状態を共有できます</p>
        {/* 次のステップで ConditionButtons をここに足す */}
      </>
    );
  }

  return null;
}
