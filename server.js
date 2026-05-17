const express = require('express');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

const homeRouter = require('./routes/home');
const searchRouter = require('./routes/search');
const watchRouter = require('./routes/watch');
const suggestRouter = require('./routes/suggests');
const channelRouter = require('./routes/channel');
const getEduUrl = require('./api/youtube/edu');
const getDownloadInfo = require('./api/youtube/dl');
const sennintubeRouter = require('./routes/sennintube/routes');

app.use('/', homeRouter);
app.use('/search', searchRouter);
app.use('/watch', watchRouter);
app.use('/api/suggests', suggestRouter);
app.use('/channel', channelRouter);
app.get('/api/youtube/edu', getEduUrl);
app.get('/api/youtube/dl', getDownloadInfo);
app.use('/', sennintubeRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
