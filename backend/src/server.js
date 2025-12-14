const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Backend server listening on port ${PORT}`);

  // Start Background Jobs
  const absenceJob = require('../jobs/absenceWarning.job');
  absenceJob.start();
});
