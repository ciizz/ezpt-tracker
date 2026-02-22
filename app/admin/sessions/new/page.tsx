import SessionForm from "@/app/components/SessionForm";

export default function NewSessionPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">New Session</h1>
      <SessionForm mode="create" />
    </div>
  );
}
