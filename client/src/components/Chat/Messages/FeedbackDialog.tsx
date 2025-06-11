import React, { useState, useEffect, useMemo } from 'react';
import type { TConversation, TMessage } from 'librechat-data-provider';
import { OGDialog, DialogTemplate, Button } from '~/components/ui';
import { useAuthContext } from '~/hooks/AuthContext';
import { useLocalize } from '~/hooks';

import FeedbackField from '../ui/FeedbackField'; // Assumes FeedbackField component exists
import feedbackConfig from '../ui/feedbackButtonConfig.json';

const { feedbackCategories } = feedbackConfig;

interface FeedbackDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedCategoryId: string | null;
  message: TMessage;
  conversation: TConversation;
}

const FeedbackDialog: React.FC<FeedbackDialogProps> = ({
  isOpen,
  onOpenChange,
  selectedCategoryId,
  message,
  conversation,
}) => {
  const localize = useLocalize();
  const { user } = useAuthContext();
  const [formData, setFormData] = useState<{ [key: string]: string | File }>({});

  const category = useMemo(
    () => feedbackCategories.find((cat) => cat.id === selectedCategoryId),
    [selectedCategoryId],
  );

  useEffect(() => {
    // Reset form data when dialog is opened or category changes
    if (isOpen) {
      setFormData({});
    }
  }, [isOpen]);

  const handleFieldChange = (id: string, value: string | File) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!category) return;

    const submissionData = new FormData();
    const meta = {
      email: user?.email,
      messageId: message.messageId,
      conversationId: conversation.conversationId,
      timestamp: new Date().toISOString(),
      category: category.id,
      categoryLabel: localize(category.labelKey),
    };
    const feedbackBody: { [key: string]: string } = {};

    submissionData.append('metaData', JSON.stringify(meta));
    
    for (const key in formData) {
      const value = formData[key];
      if (value instanceof File) {
        submissionData.append(key, value);
      } else {
        feedbackBody[key] = value;
      }
    }
    submissionData.append('feedbackData', JSON.stringify(feedbackBody));

    try {
      const response = await fetch('YOUR_ENDPOINT_URL', { // <-- Set your submission URL
        method: 'POST',
        headers: { 'GenAPI': 'YOUR_API_KEY' }, // <-- Set your API key
        body: submissionData,
      });

      if (!response.ok) throw new Error('Network response was not ok');

      alert(localize('com_ui_feedback_success'));
      onOpenChange(false);
    } catch (error) {
      console.error('Feedback submission error:', error);
      alert(localize('com_ui_feedback_error'));
    }
  };

  if (!category) {
    return null;
  }

  return (
    <OGDialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTemplate
        title={localize(category.labelKey)}
        className="w-11/12 max-w-3xl sm:w-3/4 md:w-1/2 lg:w-2/5"
        showCloseButton={true}
        main={
          <form onSubmit={handleSubmit}>
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
                        Upload File
                      </Button>
                      {fileName && (
                        <div>
                          Selected: {fileName}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>
            <div className="flex justify-end mt-4 p-4 border-t border-border-medium">
              <Button type="submit" className="bg-primary hover:bg-primary-hover text-white">
                {localize('com_ui_feedback_submit')}
              </Button>
            </div>
          </form>
        }
      />
    </OGDialog>
  );
};

export default FeedbackDialog;