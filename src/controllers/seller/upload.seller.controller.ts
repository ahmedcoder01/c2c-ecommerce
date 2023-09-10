import { ExpressHandler } from '../../types';

export const upload: ExpressHandler<any, any> = async (req, res) => {
  const { file } = req;
  if (!file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  return res.status(200).json({ message: 'File uploaded', url: file.path });
};
