const blocked = [
  /exploit database/i,
  /dark web/i,
  /leaked credentials/i,
  /payload/i,
  /proof of concept/i,
  /bypass login/i,
  /malware source/i
];

function filterSafeTopics(topics = []) {
  return topics
    .filter(topic => topic && topic.topic && topic.summary)
    .filter(topic => !blocked.some(pattern => pattern.test(`${topic.topic} ${topic.summary}`)))
    .slice(0, 12);
}

module.exports = { filterSafeTopics };
