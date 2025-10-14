import { CopilotChat } from "@copilotkit/react-ui";

export default function Home() {
  return (
    <CopilotChat
      instructions={"You are assisting the user as best as you can. Answer in the best way possible given the data you have."}
      labels={{
        title: "Your Assistant",
        initial: "Hola! 👋 Estas listo para analizar radiosondeos?",
      }}
    />
  );
}
