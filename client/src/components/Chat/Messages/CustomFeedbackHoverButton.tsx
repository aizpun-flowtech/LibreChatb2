import React, { useState, useMemo } from 'react';
import type { TConversation, TMessage } from 'librechat-data-provider';
import { MessageSquareWarningIcon } from 'lucide-react';

// UI, Hooks, and Components
import { useLocalize } from '~/hooks';
import GenericDropdownMenu from './GenericDropdownMenu'; // Use the generic component
import FeedbackDialog from './FeedbackDialog'; // Use the new dialog component

const feedbackConfig = 
{
    "feedbackCategories": [
      {
        "id": "bad_ai_answer",
        "label": "Bad AI Answer",
        "fields": [
          {
            "id": "issue_description",
            "label": "What was incorrect or unhelpful?",
            "type": "textarea",
            "required": true,
            "placeholder": "Describe the problem..."
          },
          {
            "id": "suggested_improvement",
            "label": "Suggested improvement (optional)",
            "type": "textarea",
            "required": false,
            "placeholder": "How could the answer be better?"
          }
        ]
      },
      {
        "id": "error",
        "label": "Error",
        "fields": [
          {
            "id": "error_description",
            "label": "Describe the error",
            "type": "textarea",
            "required": true,
            "placeholder": "What went wrong?"
          },
          {
            "id": "screenshot",
            "label": "Attach screenshot (optional)",
            "type": "file",
            "required": false,
            "accept": "image/*"
          }
        ]
      },
      {
        "id": "thank_you",
        "label": "Thank You",
        "fields": [
          {
            "id": "message",
            "label": "Your message (optional)",
            "type": "textarea",
            "required": false,
            "placeholder": "Thanks for..."
          }
        ]
      },
      {
        "id": "suggestion",
        "label": "Suggestion",
        "fields": [
          {
            "id": "suggestion_details",
            "label": "Your suggestion",
            "type": "textarea",
            "required": true,
            "placeholder": "How can we improve?"
          }
        ]
      },
      {
        "id": "other",
        "label": "Other",
        "fields": [
          {
            "id": "description",
            "label": "Describe your feedback",
            "type": "textarea",
            "required": true,
            "placeholder": "Provide details..."
          }
        ]
      }
    ],
    "metaData": [
      {
        "email": "user_email",
        "chat-messageid": "chat messageid",
        "chatid": "chatid",
        "required": true
      }
    ]
  }
  

// Define the props the component needs from its parent (e.g., HoverButtons)
interface CustomFeedbackHoverButtonProps {
  isLast: boolean;
  message: TMessage;
  conversation: TConversation;
}

const CustomFeedbackHoverButton: React.FC<CustomFeedbackHoverButtonProps> = ({
  isLast,
  message,
  conversation,
}) => {
  const localize = useLocalize();

  // State is managed here to control the dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Prepare the options for the dropdown menu
  // The onClick handler for each option will set the state and open the dialog
  const feedbackOptions = useMemo(() => {
    return feedbackConfig.feedbackCategories.map((category) => ({
      id: category.id,
      label: localize(category.labelKey),
      onClick: () => {
        setSelectedCategory(category.id);
        setIsDialogOpen(true);
      },
    }));
  }, [localize]);

  return (
    // The dialog will only be visible when isDialogOpen is true.
    <>
      <GenericDropdownMenu
        isLast={isLast}
        title={localize('com_ui_feedback_send')}
        triggerButtonContent={<MessageSquareWarningIcon size="19" />}
        options={feedbackOptions}
      />

      {/* 
        The Dialog component is rendered here, but controlled by the state of this component.
      */}
      <FeedbackDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        selectedCategoryId={selectedCategory}
        message={message}
        conversation={conversation}
      />
    </>
  );
};

export default CustomFeedbackHoverButton;