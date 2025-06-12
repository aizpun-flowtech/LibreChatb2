import React, { useState, useMemo, memo } from 'react';
import { useRecoilState } from 'recoil';
import type { TConversation, TMessage, TFeedback } from 'librechat-data-provider';
import { EditIcon, Clipboard, CheckMark, ContinueIcon, RegenerateIcon } from '~/components';
import { useGenerationsByLatest, useLocalize } from '~/hooks';
import { Fork } from '~/components/Conversations';
import MessageAudio from './MessageAudio';
import Feedback from './Feedback';
import { cn } from '~/utils';
import store from '~/store';
import { LucideProps, MessageSquareWarningIcon } from 'lucide-react';
import GenericDropdownMenu from './GenericDropdownMenu';
import DialogTemplate from '~/components/ui/DialogTemplate';
import { OGDialog, Textarea, Button } from '~/components/ui';
import { useAuthContext } from '~/hooks/AuthContext';

type TCustomButtom = {
  title: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  icon: React.ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>>;
}

type THoverButtons = {
  isEditing: boolean;
  enterEdit: (cancel?: boolean) => void;
  copyToClipboard: (setIsCopied: React.Dispatch<React.SetStateAction<boolean>>) => void;
  conversation: TConversation | null;
  isSubmitting: boolean;
  message: TMessage;
  regenerate: () => void;
  handleContinue: (e: React.MouseEvent<HTMLButtonElement>) => void;
  latestMessage: TMessage | null;
  isLast: boolean;
  index: number;
  customButtons?: TCustomButtom[];
  handleFeedback: ({ feedback }: { feedback: TFeedback | undefined }) => void;
};

type HoverButtonProps = {
  onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  title: string;
  icon: React.ReactNode;
  isActive?: boolean;
  isVisible?: boolean;
  isDisabled?: boolean;
  isLast?: boolean;
  className?: string;
  buttonStyle?: string;
};

const extractMessageContent = (message: TMessage): string => {
  if (typeof message.content === 'string') {
    return message.content;
  }

  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }
        if ('text' in part) {
          return part.text || '';
        }
        if ('think' in part) {
          const think = part.think;
          if (typeof think === 'string') {
            return think;
          }
          return think && 'text' in think ? think.text || '' : '';
        }
        return '';
      })
      .join('');
  }

  return message.text || '';
};

const HoverButton = memo(
  ({
    onClick,
    title,
    icon,
    isActive = false,
    isVisible = true,
    isDisabled = false,
    isLast = false,
    className = '',
  }: HoverButtonProps) => {
    const buttonStyle = cn(
      'hover-button rounded-lg p-1.5',

      'hover:bg-gray-100 hover:text-gray-500',

      'dark:text-gray-400/70 dark:hover:bg-gray-700 dark:hover:text-gray-200',
      'disabled:dark:hover:text-gray-400',

      'md:group-hover:visible md:group-focus-within:visible md:group-[.final-completion]:visible',
      !isLast && 'md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100',
      !isVisible && 'opacity-0',

      'focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white focus-visible:outline-none',

      isActive && isVisible && 'active text-gray-700 dark:text-gray-200 bg-gray-100 bg-gray-700',

      className,
    );

    return (
      <button
        className={buttonStyle}
        onClick={onClick}
        type="button"
        title={title}
        disabled={isDisabled}
      >
        {icon}
      </button>
    );
  },
);

HoverButton.displayName = 'HoverButton';

const HoverButtons = ({
  index,
  isEditing,
  enterEdit,
  copyToClipboard,
  conversation,
  isSubmitting,
  message,
  regenerate,
  handleContinue,
  latestMessage,
  isLast,
  customButtons,
  handleFeedback,
}: THoverButtons) => {
  const localize = useLocalize();
  const [isCopied, setIsCopied] = useState(false);
  const [TextToSpeech] = useRecoilState<boolean>(store.textToSpeech);

  const endpoint = useMemo(() => {
    if (!conversation) {
      return '';
    }
    return conversation.endpointType ?? conversation.endpoint;
  }, [conversation]);

  const generationCapabilities = useGenerationsByLatest({
    isEditing,
    isSubmitting,
    error: message.error,
    endpoint: endpoint ?? '',
    messageId: message.messageId,
    searchResult: message.searchResult,
    finish_reason: message.finish_reason,
    isCreatedByUser: message.isCreatedByUser,
    latestMessageId: latestMessage?.messageId,
  });

  const {
    hideEditButton,
    regenerateEnabled,
    continueSupported,
    forkingSupported,
    isEditableEndpoint,
  } = generationCapabilities;

  if (!conversation) {
    return null;
  }

  const { user } = useAuthContext();
  const { isCreatedByUser, error } = message;

  if (error === true) {
    return (
      <div className="visible flex justify-center self-end lg:justify-start">
        {regenerateEnabled && (
          <HoverButton
            onClick={regenerate}
            title={localize('com_ui_regenerate')}
            icon={<RegenerateIcon size="19" />}
            isLast={isLast}
          />
        )}
      </div>
    );
  }

  const onEdit = () => {
    if (isEditing) {
      return enterEdit(true);
    }
    enterEdit();
  };

  const handleCopy = () => copyToClipboard(setIsCopied);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedFeedbackOption, setSelectedFeedbackOption] = useState(null)
  const [fileName, setFileName] = useState<string | null>(null);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  React.useEffect(() => {
    if (fileName) {
      setFileName(null)
    }
  }, [isOpen])

  const feedbackData = {
    "feedbackCategories": [
      {
        "id": "bad_ai_answer",
        "label": localize('com_ui_feedback_category_bad_ai_answer'),
        "fields": [
          {
            "id": "issue_description",
            "label": localize('com_ui_feedback_field_issue_description_label'),
            "type": "textarea",
            "required": true,
            "placeholder": localize('com_ui_feedback_field_issue_description_placeholder')
          },
          {
            "id": "suggested_improvement",
            "label": localize('com_ui_feedback_field_suggested_improvement_label'),
            "type": "textarea",
            "required": false,
            "placeholder": localize('com_ui_feedback_field_suggested_improvement_placeholder')
          }
        ]
      },
      {
        "id": "error",
        "label": localize('com_ui_feedback_category_error'),
        "fields": [
          {
            "id": "error_description",
            "label": localize('com_ui_feedback_field_error_description_label'),
            "type": "textarea",
            "required": true,
            "placeholder": localize('com_ui_feedback_field_error_description_placeholder')
          },
          {
            "id": "screenshot",
            "label": localize('com_ui_feedback_field_screenshot_label'),
            "type": "file",
            "required": false,
            "accept": "image/*"
          }
        ]
      },
      {
        "id": "thank_you",
        "label": localize('com_ui_feedback_category_thank_you'),
        "fields": [
          {
            "id": "message",
            "label": localize('com_ui_feedback_field_message_label'),
            "type": "textarea",
            "required": false,
            "placeholder": localize('com_ui_feedback_field_message_placeholder')
          }
        ]
      },
      {
        "id": "suggestion",
        "label": localize('com_ui_feedback_category_suggestion'),
        "fields": [
          {
            "id": "suggestion_details",
            "label": localize('com_ui_feedback_field_suggestion_details_label'),
            "type": "textarea",
            "required": true,
            "placeholder": localize('com_ui_feedback_field_suggestion_details_placeholder')
          }
        ]
      },
      {
        "id": "other",
        "label": localize('com_ui_feedback_category_other'),
        "fields": [
          {
            "id": "description",
            "label": localize('com_ui_feedback_field_description_label'),
            "type": "textarea",
            "required": true,
            "placeholder": localize('com_ui_feedback_field_description_placeholder')
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

  return (
    <div className="group visible flex justify-center gap-0.5 self-end focus-within:outline-none lg:justify-start">
      {/* Text to Speech */}
      {TextToSpeech && (
        <MessageAudio
          index={index}
          isLast={isLast}
          messageId={message.messageId}
          content={extractMessageContent(message)}
          renderButton={(props) => (
            <HoverButton
              onClick={props.onClick}
              title={props.title}
              icon={props.icon}
              isActive={props.isActive}
              isLast={isLast}
            />
          )}
        />
      )}

      {/* Copy Button */}
      <HoverButton
        onClick={handleCopy}
        title={
          isCopied ? localize('com_ui_copied_to_clipboard') : localize('com_ui_copy_to_clipboard')
        }
        icon={isCopied ? <CheckMark className="h-[18px] w-[18px]" /> : <Clipboard size="19" />}
        isLast={isLast}
        className={`ml-0 flex items-center gap-1.5 text-xs ${isSubmitting && isCreatedByUser ? 'md:opacity-0 md:group-hover:opacity-100' : ''}`}
      />

      {/* Edit Button */}
      {isEditableEndpoint && (
        <HoverButton
          onClick={onEdit}
          title={localize('com_ui_edit')}
          icon={<EditIcon size="19" />}
          isActive={isEditing}
          isVisible={!hideEditButton}
          isDisabled={hideEditButton}
          isLast={isLast}
          className={isCreatedByUser ? '' : 'active'}
        />
      )}

      {/* Fork Button */}
      <Fork
        messageId={message.messageId}
        conversationId={conversation.conversationId}
        forkingSupported={forkingSupported}
        latestMessageId={latestMessage?.messageId}
        isLast={isLast}
      />

      {/* Feedback Buttons */}
      {!isCreatedByUser && (
        <Feedback handleFeedback={handleFeedback} feedback={message.feedback} isLast={isLast} />
      )}

      {/* Regenerate Button */}
      {regenerateEnabled && (
        <HoverButton
          onClick={regenerate}
          title={localize('com_ui_regenerate')}
          icon={<RegenerateIcon size="19" />}
          isLast={isLast}
          className="active"
        />
      )}

      {/* Continue Button */}
      {continueSupported && (
        <HoverButton
          onClick={(e) => e && handleContinue(e)}
          title={localize('com_ui_continue')}
          icon={<ContinueIcon className="w-19 h-19 -rotate-180" />}
          isLast={isLast}
          className="active"
        />
      )}

      {customButtons?.map((button, i) => (
        <button
          key={i}
          className={cn(
            'hover-button rounded-md p-1 hover:bg-gray-100 hover:text-gray-500 focus:opacity-100 dark:text-gray-400/70 dark:hover:bg-gray-700 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400 md:group-hover:visible md:group-[.final-completion]:visible',
            !isLast ? 'md:opacity-0 md:group-hover:opacity-100' : '',
          )}
          onClick={button.onClick}
          type="button"
          title={localize(`com_ui_${button.title}` as any) || button.title}
        >
          <button.icon className="h-4 w-4 hover:text-gray-500 dark:hover:text-gray-200 disabled:dark:hover:text-gray-400" size="19" />
        </button>
      ))}

      <GenericDropdownMenu
        isLast={isLast}
        title={localize('com_ui_feedback_send')}
        triggerButtonContent={<MessageSquareWarningIcon size="19" />}
        options={feedbackData.feedbackCategories}
        openDialog={handleOpen}
        setSelectedFeedbackOption={setSelectedFeedbackOption}
      />
      <OGDialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTemplate
          title={feedbackData.feedbackCategories[selectedFeedbackOption]?.label}
          className="w-11/12 max-w-3xl sm:w-3/4 md:w-1/2 lg:w-2/5"
          showCloseButton={false}
          showCancelButton={false}
          main={
            <form
              onSubmit={async (e) => {
                e.preventDefault();

                const textarea1 = (document.getElementById("TextArea1") as HTMLInputElement)?.value;
                const textarea2 = (document.getElementById("TextArea2") as HTMLInputElement)?.value;
                const fileInput = document.getElementById("screenshot") as HTMLInputElement;
                const file = fileInput?.files?.[0] || null;

                const formData = new FormData();

                // Append metadata as JSON string
                formData.append(
                  "metaData",
                  JSON.stringify(
                    {
                      email: user.email,
                      messageid: message.messageId,
                      chatid: conversation.conversationId,
                      timestamp: new Date().toISOString(),
                    },
                  )
                );

                // Append feedback data as JSON string (excluding file)
                formData.append(
                  "feedbackData",
                  JSON.stringify(
                    {
                      selectedCategory: feedbackData.feedbackCategories[selectedFeedbackOption]?.label,
                      textarea1,
                      textarea2,
                    },
                  )
                );

                // Append the screenshot file (if provided)
                if (file) {
                  formData.append("screenshot", file);
                }

                const response = await fetch("https://n8n.insurai.de/webhook/feedback", {
                  method: "POST",
                  headers: {
                    "GenAPI": "724055b8-29ef-40aa-b79f-7720d51bf719"
                    // Do NOT set Content-Type when sending FormData — browser sets it with proper boundary
                  },
                  body: formData,
                });

                if (response.ok) {
                  handleClose()
                  alert(localize('com_ui_feedback_success'));
                } else {
                  alert(localize('com_ui_feedback_error'));
                }
              }}
            >
              <section tabIndex={0} className="max-h-[60vh] overflow-y-auto p-4">
                <div className="prose dark:prose-invert w-full max-w-none !text-text-primary">
                  <label for="TextArea1">{feedbackData.feedbackCategories[selectedFeedbackOption]?.fields[0]?.label}</label>
                  <Textarea
                    id="TextArea1"
                    name="textarea1"
                    style={{ border: '1px solid gray', marginVertical: 5 }}
                    placeholder={feedbackData.feedbackCategories[selectedFeedbackOption]?.fields[0]?.placeholder}
                    required={feedbackData.feedbackCategories[selectedFeedbackOption]?.fields[0]?.required}
                  />
                  {feedbackData.feedbackCategories[selectedFeedbackOption]?.fields[1]?.type === "textarea" && (
                    <>
                      <label for="TextArea2">{feedbackData.feedbackCategories[selectedFeedbackOption]?.fields[1]?.label}</label>
                      <Textarea
                        id="TextArea2"
                        name="textarea2"
                        style={{ border: '1px solid gray', marginVertical: 5 }}
                        placeholder={feedbackData.feedbackCategories[selectedFeedbackOption]?.fields[1]?.placeholder}
                        required={feedbackData.feedbackCategories[selectedFeedbackOption]?.fields[1]?.required}
                      />
                    </>
                  )}
                  {feedbackData.feedbackCategories[selectedFeedbackOption]?.fields[1]?.type === "file" && (
                    <>
                      <input
                        id="screenshot"
                        type="file"
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={(e) => setFileName(e.target.files?.[0]?.name || null)}
                      />
                      <Button
                        className={'my-3'}
                        onClick={(e) => {
                          e.preventDefault();
                          (document.getElementById('screenshot') as HTMLInputElement)?.click();
                        }}
                      >
                        {feedbackData.feedbackCategories[selectedFeedbackOption]?.fields[1]?.label}
                      </Button>
                      {fileName && (
                        <div>
                          {localize('com_ui_feedback_file_selected')} <b>{fileName}</b>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>

              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-border-heavy bg-surface-primary px-4 py-2 text-sm text-text-primary hover:bg-green-500 hover:text-white focus:bg-green-500 focus:text-white dark:hover:bg-green-600 dark:focus:bg-green-600"
                >
                  {localize('com_ui_feedback_submit')}
                </button>
              </div>
            </form>
          }
        />
      </OGDialog>

    </div >

  );
};

export default memo(HoverButtons);
