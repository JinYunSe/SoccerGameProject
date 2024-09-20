export default (err, req, res, next) => {
  console.log(err);

  if (err.name === 'ValidationError')
    return res.status(400).json('데이터 형식이 옳바르지 않습니다');

  res.status(500).json({ errorMessage: '서버 내부 에러가 발생했습니다.' });
};
