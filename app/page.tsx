import { CopilotChat } from "@copilotkit/react-ui";

export default function Page() {
  return (
    <CopilotChat
      instructions={"You are assisting the user as best as you can. Answer in the best way possible given the data you have."}
      labels={{
        title: "Your Assistant",
        initial: "Hola, Qué puedo hacer por ti?",
      }}
    />
  );
}
