const randomNumber01 = () => {
  return Math.random(0, 1);
};

const rarityOutputPrint = (value) => {
  if (0 <= value && value <= 0.33) return 'SSR';
  // 4%
  else if (0.33 < value && value <= 0.66) return 'SR';
  // 43%
  else return 'R';
  // 53%

  //로 줄 예정 입니다.
  //현재는 테스트를 위해 위와 같이 적용
};

export { randomNumber01, rarityOutputPrint };
