const fs = require('fs');
const path = require('path');
const readline = require('readline');

const args = process.argv.slice(2);
const folderName = args[0];

if (!folderName) {
  console.error('Please provide a folder name for the products directory.');
  process.exit(1);
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Set the base path to 'src/api'
const basePath = path.join(__dirname, 'src', 'api');
fs.mkdirSync(basePath, { recursive: true });

// Helper functions
const upperCaseFirstLetter = (str) =>
  str.charAt(0).toUpperCase() + str.slice(1);
const lowerCaseFirstLetter = (str) =>
  str.charAt(0).toLowerCase() + str.slice(1);

let schemaFields = [];
let fields = [];

// Function to ask for schema fields
const askForSchemaFields = async () => {
  return new Promise((resolve) => {
    const askField = () => {
      rl.question(
        'Enter field name (or press Enter to finish): ',
        (fieldName) => {
          if (!fieldName) {
            resolve(schemaFields);
            return;
          }

          // Add the field name to the fields array to be used in the controller
          fields.push(fieldName);

          rl.question(
            'Enter field type (String, Number, Boolean, Date, etc.): ',
            (fieldType) => {
              schemaFields.push({
                name: fieldName,
                type: fieldType || 'String',
              });
              askField();
            }
          );
        }
      );
    };

    askField();
  });
};

// Function to generate schema string
const generateSchemaString = (fields) => {
  const fieldDefinitions = fields
    .map(
      (field) => `\t\t${field.name}: { 
        type: ${field.type}, 
        required: true 
      }`
    )
    .join(',\n');
  return `
import { Schema, model } from 'mongoose'

const ${upperCaseFirstLetter(folderName)}Schema = new Schema(
	{
${fieldDefinitions}
	},
	{
		timestamps: true
	}
)

const ${upperCaseFirstLetter(folderName)} = model('${upperCaseFirstLetter(folderName)}', ${upperCaseFirstLetter(folderName)}Schema);
export default ${upperCaseFirstLetter(folderName)};
`;
};

// Main function to generate the structure
const generateFiles = async () => {
  console.log(`Define schema for ${folderName}`);
  const schemaFields = await askForSchemaFields();
  rl.close();

  // Set base path to 'src/api'
  const basePath = path.join(__dirname, 'src', 'api');
  fs.mkdirSync(basePath, { recursive: true });

  const destructuredFields = fields.filter(Boolean).join(', ');

  const allowedUpdatesStr = fields.map((field) => `'${field}'`).join(', ');

  const validations = fields
    .map(
      (field) =>
        `body('${field}', '${upperCaseFirstLetter(field)} cannot be Empty').not().isEmpty()`
    )
    .join(',\n  ');

  // Define the dynamic structure based on the provided folder name
  const structure = {
    [lowerCaseFirstLetter(folderName)]: {
      schema: {
        'index.ts': generateSchemaString(schemaFields),
      },
      controllers: {
        'create.ts': `
import { Request, Response } from 'express'
import ${upperCaseFirstLetter(folderName)} from '../schema';
import message from '../../../shared/message';

const create = async (req: Request, res: Response) => {
	try {
		const { ${destructuredFields} } = req.body;

    await ${upperCaseFirstLetter(folderName)}.create({ ${destructuredFields} });

    res.status(201).json({ message: message.createdSuccessfully });
	} catch (error) {
		res.status(500).json({ message: message.pleaseTryAgainLater });
	}
}

export default create
`,
        'get.ts': `
import { Request, Response } from 'express';
import ${upperCaseFirstLetter(folderName)} from '../schema';
import message from '../../../shared/message';

const get = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const ${lowerCaseFirstLetter(folderName)} = await ${upperCaseFirstLetter(folderName)}.findById(id);

    res.status(200).json({ ${lowerCaseFirstLetter(folderName)} });
  } catch (error) {
    res.status(500).json({ message: message.pleaseTryAgainLater });
  }
};

export default get;
`,
        'gets.ts': `
import { Request, Response } from 'express';
import ${upperCaseFirstLetter(folderName)} from '../schema';
import message from '../../../shared/message';

const gets = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);
    const skip = (pageNumber - 1) * limitNumber;

    const ${lowerCaseFirstLetter(folderName)} = await ${upperCaseFirstLetter(folderName)}.find()
      .skip(skip)
      .limit(limitNumber);

    const total = await ${upperCaseFirstLetter(folderName)}.countDocuments();

    res.status(200).json({ total, ${lowerCaseFirstLetter(folderName)} });
  } catch (error) {
    res.status(500).json({ message: message.pleaseTryAgainLater });
  }
};

export default gets;
`,
        'update.ts': `
import { Request, Response } from 'express';
import ${upperCaseFirstLetter(folderName)} from '../schema';
import message from '../../../shared/message';
import allowedUpdate from '../../../shared/allowUpdate';

const update = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const allowedUpdates = [${allowedUpdatesStr}];

    const updateData: Record<string, any> = allowedUpdate(
      req,
      allowedUpdates
    );

    const updated = await ${upperCaseFirstLetter(folderName)}.findByIdAndUpdate(
      { _id: id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      res.status(404).json({ message: '${upperCaseFirstLetter(folderName)} ' + message.notFound });

      return;
    }

    res.status(200).json({ message: message.updatedSuccessfully });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: message.pleaseTryAgainLater });
  }
};

export default update;
`,
        'remove.ts': `
import { Request, Response } from 'express';
import ${upperCaseFirstLetter(folderName)} from '../schema';
import message from '../../../shared/message';

const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await ${upperCaseFirstLetter(folderName)}.findByIdAndDelete(id);

    if (!deleted) {
      res.status(404).json({ message: '${upperCaseFirstLetter(folderName)} ' + message.notFound });

      return;
    }

    res.status(200).json({ message: message.deletedSuccessfully });
  } catch (error) {
    res.status(500).json({ message: message.pleaseTryAgainLater });
  }
};

export default remove;
`,
      },
      router: {
        'index.ts': `
import { Router } from 'express';

import get from '../controllers/get';
import gets from '../controllers/gets';
import create from '../controllers/create';
import update from '../controllers/update';
import remove from '../controllers/remove';

import validateParamsId from '../../../shared/validateParamsId';
import validateRequest from '../../../shared/validateBodyRequest';

import { validateCreateBody } from '../validator';

const router = Router();

router.post('/${lowerCaseFirstLetter(folderName)}', validateCreateBody, validateRequest, create);

router.get('/${lowerCaseFirstLetter(folderName)}/:id', validateParamsId, get);

router.get('/${lowerCaseFirstLetter(folderName)}', gets);

router.patch('/${lowerCaseFirstLetter(folderName)}/:id', validateParamsId, update);

router.delete('/${lowerCaseFirstLetter(folderName)}/:id', validateParamsId, remove);

const ${lowerCaseFirstLetter(folderName)}Router = router;

export default ${lowerCaseFirstLetter(folderName)}Router;
`,
      },
      validator: {
        'index.ts': `
import { body } from 'express-validator';

const validateCreateBody = [
  ${validations}
];

const validateUpdateBody = [
  body('name', 'Name cannot be Empty').not().isEmpty()
];

export { validateCreateBody, validateUpdateBody };
`,
      },
    },
  };

  // Define the folder structure
  const createStructure = (basePath, structure) => {
    for (const key in structure) {
      const newBasePath = path.join(basePath, key);
      if (typeof structure[key] === 'object') {
        fs.mkdirSync(newBasePath, { recursive: true });
        createStructure(newBasePath, structure[key]);
      } else {
        fs.writeFileSync(newBasePath, structure[key]);
      }
    }
  };

  // Create the folder structure starting from the 'src/api' directory
  createStructure(basePath, structure);

  console.log(
    `Folder and file structure for '${folderName}' created successfully.`
  );
};

generateFiles();
