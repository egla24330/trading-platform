export default function ConfirmationModal({
  isOpen,
  amount,
  coin,
  network,
  withdrawAddress,
  fee,
  isSubmitting,
  onCancel,
  onConfirm
}) {
  if (!isOpen) return null;

  const receiveAmount = (parseFloat(amount) - parseFloat(fee || 0)).toFixed(6);
  

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 w-full max-w-md rounded-2xl border border-gray-700/40 shadow-xl p-6 animate-fadeIn">

        <h3 className="text-xl font-bold text-white mb-1">Confirm Withdrawal</h3>
        <p className="text-gray-400 mb-6 text-sm">Review your withdrawal details carefully.</p>

        <div className="space-y-4 mb-6">

          <div className="flex justify-between">
            <span className="text-gray-400">Amount</span>
            <span className="text-white font-semibold">{amount} {coin}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Fee</span>
            <span className="text-red-400 font-medium">{fee} {coin}</span>
          </div>

          <div className="flex justify-between border-t border-gray-700 pt-3">
            <span className="text-gray-300 font-medium">You Receive</span>
            <span className="text-green-400 font-semibold">
              {receiveAmount} {coin}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-400">Network</span>
            <span className="text-white">{network}</span>
          </div>

          <div className="border-t border-gray-700 pt-4">
            <p className="text-gray-400 text-sm mb-1">To Address</p>
            <p className="text-white font-mono text-sm break-all leading-relaxed">
              {withdrawAddress}
            </p>
          </div>

        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition-colors font-medium"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Processing..." : "Confirm"}
          </button>
        </div>

      </div>
    </div>
  );
}
