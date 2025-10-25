import { ResponseDTO } from 'src/constants/response.dto';

export const RESPONSE: Function = (
  status: number = 0,
  response: object = {},
  message: string = '',
): ResponseDTO => {
  return {
    status: status,
    response: response,
    message: message,
  };
};
