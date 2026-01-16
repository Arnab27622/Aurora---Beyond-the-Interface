/**
 * EmptyState Component
 * 
 * Displays a welcome message when no chat messages exist.
 * Centered on screen with a friendly prompt to encourage user interaction.
 */

export function EmptyState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-normal text-center">
        What can I help with?
      </h2>
    </div>
  );
}
