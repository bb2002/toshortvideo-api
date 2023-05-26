import { diskStorage } from 'multer';
import { validateIsSupportVideo } from '../../components/storage/utils/validateIsSupportVideo';
import { ForbiddenException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

const storage = diskStorage({
  destination: 'tmp',
  filename: (req, file, cb) => {
    if (validateIsSupportVideo(file)) {
      cb(null, uuidv4());
    } else {
      cb(new ForbiddenException('Not support file'), null);
    }
  },
});

export default storage;
