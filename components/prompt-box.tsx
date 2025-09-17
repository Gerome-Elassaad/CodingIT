import { PromptInputBox } from "@/components/ui/ai-prompt-box";
import { LLMModel, LLMModelConfig } from "@/lib/models";
import models from "@/lib/models.json";
import templates, { TemplateId } from "@/lib/templates";
import Cookies from 'js-cookie'
import { useEffect, useState } from "react";

interface PromptBoxProps {
  aiChatInput: string;
  setAiChatInput: (value: string) => void;
  sendChatMessage: () => void;
  isGenerating: boolean;
  languageModel: LLMModelConfig;
  onLanguageModelChange: (modelConfig: LLMModelConfig) => void;
}

const PromptBox: React.FC<PromptBoxProps> = ({
  aiChatInput,
  setAiChatInput,
  sendChatMessage,
  isGenerating,
  languageModel,
  onLanguageModelChange,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | "auto">("auto");

  useEffect(() => {
    const savedTemplate = Cookies.get('selected_template') as TemplateId | 'auto'
    if (savedTemplate) {
      setSelectedTemplate(savedTemplate)
    }

    const savedConfig = Cookies.get('llm_config')
    if (savedConfig) {
      onLanguageModelChange(JSON.parse(savedConfig))
    }
  }, [])

  const handleSendMessage = () => {
    sendChatMessage();
  };

  const filteredModels = models.models as LLMModel[];

  return (
    <div className="w-full">
      <PromptInputBox
        value={aiChatInput}
        onValueChange={setAiChatInput}
        onSend={handleSendMessage}
        isLoading={isGenerating}
        templates={templates}
        selectedTemplate={selectedTemplate}
        onSelectedTemplateChange={setSelectedTemplate}
        models={filteredModels}
        languageModel={languageModel}
        onLanguageModelChange={onLanguageModelChange}
        apiKeyConfigurable={!process.env.NEXT_PUBLIC_NO_API_KEY_INPUT}
        baseURLConfigurable={!process.env.NEXT_PUBLIC_NO_BASE_URL_INPUT}
      />
    </div>
  );
};

export { PromptBox };
