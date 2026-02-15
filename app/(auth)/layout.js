export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4">
      {children}
    </div>
  );
}
