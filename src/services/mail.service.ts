// import mailersend

export const sendEmail = async ({
  email,
  message,
  templateId,
}: {
  email: string;
  message: string;
  templateId?: number;
}) => {
  // logic goes here
};

export const batchSendEmail = async ({
  emails,
  message,
  templateId,
}: {
  emails: string[];
  message: string;
  templateId?: number;
}) => {
  // logic goes here
};
