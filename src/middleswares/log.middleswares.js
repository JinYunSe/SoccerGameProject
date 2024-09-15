import winston from 'winston';

//winston으로 Clinet가 요청한 정보를  Log로 만든다
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

// 로그를 터미널에서 확인할 수 있도록 출력합니다.
export default (req, res, next) => {
  const start = new Date().getTime();

  res.on('finish', () => {
    const duration = new Date().getTime() - start;
    logger.info(
      `Method : ${req.method}, URL : ${req.url}, Status : ${res.statusCode}, Duration : ${duration}ms`,
    );
  });

  next();
};
