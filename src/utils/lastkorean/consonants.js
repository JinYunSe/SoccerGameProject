function checkBatchimEnding(word) {
  if (typeof word !== 'string') return null;
  return (word[word.length - 1].charCodeAt(0) - 44032) % 28 !== 0;
}

export default checkBatchimEnding;
