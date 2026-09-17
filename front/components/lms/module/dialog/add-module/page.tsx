import ModuleForm from "@/components/lms/form/ModuleForm";
import { useCreateModuleMutation } from "@/store/module/module.api";

export default function CreateModuleForm({ onSuccess }: { onSuccess?: () => void }) {
  const [createModule] = useCreateModuleMutation();

  return (
    <ModuleForm
      submitText="Створити"
      onCancel={() => onSuccess?.()}
      onSubmit={async (payload) => {
        await createModule(payload).unwrap();
        onSuccess?.();
      }}
    />
  );
}
