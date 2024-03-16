const Jimp = require('jimp');
const inquirer = require('inquirer');
const fs = require('fs');

const editImage = async (image, type) => {
    console.log('Edit image: ', type);

    switch(type){
        case 'Make image brighter':
            await image.brightness(0.5);
            break;
        case 'Increase contrast':
            await image.contrast(0.5);
            break; 
        case 'Make image b&w':
            await image.greyscale();
            break; 
        case 'Invert image':
            await image.invert();
            break;
        default:
            console.log('Wrong edit type! Ignored...')
    }

    return image;
}

const addTextWatermarkToImage = async function(inputFile, text, editType) {
  try {
    if(!fs.existsSync('./images/' + inputFile)) {
      const errMsg = 'File does not exist: ' + inputFile;
      console.warn(errMsg);
      throw Error(errMsg);
    }
    const image = await Jimp.read('./images/' + inputFile);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    const textData = {
        text,
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,
    };
    image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());
    await editImage(image, editType);    
    await image.quality(100).writeAsync(prepareOutputFilename(inputFile));
    console.log('File created successfully!')
    startApp();
} catch(error){
    console.log('Something went wrong.... Try again!')
  }
};

const addImageWatermarkToImage = async function(inputFile, watermarkFile, editType) {
  try {    
    if(!fs.existsSync('./images/' + inputFile)) {
        const errMsg = 'File does not exist: ' + inputFile; 
        console.warn(errMsg);
        throw new Error(errMsg);
    }
    if(!fs.existsSync('./images/' + watermarkFile)) {
        const errMsg = 'File does not exist: ' + watermarkFile; 
        console.warn(errMsg);
        throw new Error(errMsg);
    }
    const image = await Jimp.read('./images/' + inputFile);
    const watermark = await Jimp.read('./images/' + watermarkFile);
    const x = image.getWidth() / 2 - watermark.getWidth() / 2;
    const y = image.getHeight() / 2 - watermark.getHeight() / 2;
  
    image.composite(watermark, x, y, {
      mode: Jimp.BLEND_SOURCE_OVER,
      opacitySource: 0.5,
    });
    await editImage(image, editType);    
    await image.quality(100).writeAsync(prepareOutputFilename(inputFile));
    console.log('File created successfully!')
    startApp();
  }
  catch(error){
      console.log('Something went wrong.... Try again!')
  }
};

const prepareOutputFilename = (fileName) => { 
  const [name, format] = fileName.split('.'); 
  const supportedFormats = ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'gif'];
  if(!name || !supportedFormats.includes(format)) {
    const errMsg = 'Wrong file format: ' + fileName; 
    console.warn(errMsg);
    throw new Error(errMsg);
  }
  return `./images/outputs/${name}-with-watermark.${format}`;
};
  
const startApp = async () => {

  // Ask if user is ready
  const answer = await inquirer.prompt([{
    name: 'start',
    message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/images` folder. Then you\'ll be able to use them in the app. Are you ready?',
    type: 'confirm'
  }]);

  // if answer is no, just quit the app
  if(!answer.start) process.exit();

  // ask about input file and watermark type


  const options = await inquirer.prompt([{
    name: 'inputImage',
    type: 'input',
    message: 'What file do you want to mark?',
    default: 'test.jpg',
    },{
    name: 'edit',
    type: 'confirm',
    message: 'Do you want to edit image?'
    },{
    name: 'editType',
    message: 'Select edit mode:',
    when: (answers) => answers.edit,
    type: 'list',
    choices: ['Make image brighter', 'Increase contrast', 'Make image b&w', 'Invert image'],
    },{
    name: 'watermarkType',
    message: 'Select watermark mode:',
    type: 'list',
    choices: ['Text watermark', 'Image watermark'],
    },
  ]);

  if(options.watermarkType === 'Text watermark') {
    const text = await inquirer.prompt([{
      name: 'value',
      type: 'input',
      message: 'Type your watermark text:',
    }]);
    options.watermarkText = text.value;
    addTextWatermarkToImage(options.inputImage, options.watermarkText, options.editType);
  }
  else {
    const image = await inquirer.prompt([{
      name: 'filename',
      type: 'input',
      message: 'Type your watermark name:',
      default: 'logo.png',
    }]);
    options.watermarkImage = image.filename;
    addImageWatermarkToImage(options.inputImage, options.watermarkImage, options.editType);
  }
}

startApp();
