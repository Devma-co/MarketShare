## Setup Developer Environment
- In the furture, we will have instructions on SDF setup.

## Deployment Process
- Eventually, SDF will be implemented but for now, manual deployments shall continue

## Linting
Install the following VS Code extensions:
- ESLint 8.30.0

Install the eslint packages
```bash
npm install eslint --save-dev
// only required to run when updating dev tools
npm i eslint-plugin-import eslint-config-airbnb-base --save-dev
```

**Note:** Do not use auto fix.

```bash
# Run the below code to run the eslinter for a specific module.
eslint <module you want to lint>
```

**Note:**
- Correct formatting errors prior to code review
- Certain linting errors cannot be avoided to to the nature of suitescript/NetSuite	, many of which have already been added to the `.eslintrc` file.
- This has not yet been implemented for this repository but shall be very soon.

## SuiteScript Coding Notes
Libraries
- Where possible (2.x api only), use the Devma SS2.0 Library
- If the Devma SS2.0 Library does not have something that may be helpful for future development, please develop and add to the library. If you have questions, feel free to reach out to a dev lead.
- Other libraries should be scrutinized (underscore, moment.js, etc) before using. There are certainly valid use cases for outside libraries but should be scrutinized as they can hinder ease of maintenance and introduce unnecessary risks.

Other Expectations
- In general, please stick to netsuite best practices. For example, please write scheduled scripts as map/reduce script if the script performs updates to multiple reocrds, risks running into governance
or meets other criteria outlined in the NetSuite documentation (https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4387799161.html)
- When writing scripts that have account specific values such as customer internalids, specific custom record or list internalids, please use a script parameter. This way, we dont have to manually change scripts for each environment.

Style Guide
- As a general rule, please follow the [Air BNB Style Guide](https://github.com/airbnb/javascript)  

NetSuite makes use of ES5+ meaning you cannot use ES6 JavaScript properties for now. This includes:
- Arrow Functions I.E. `a => a + 100;`
- `Array.prototype.includes()`
- `let` and `const` keywords
- `String.prototype.startsWith()`
- See [ES6 Documentation](https://www.w3schools.com/js/js_es6.asp) for all ES6 methods
- **Note:** NetSuite is actively updating their APIs and it may soon be possible to use ES6 in the near future.

Loops
- As a general rule, try to use `for in` loops
- `Array.prototype.map()` is also acceptable when mutating an array

Variable Declarations
- I know it is not ideal, but please only use `var` for variable declarations. `let` and `const` are the true modern standard but can break in unpredictable ways.
- When naming variables, please use camelcasing and make the names descriptive
- Avoid unused variables
- Avoid unnecessary variable assignment
```javascript
// Bad
function(data) {
	var thing = data.thing;
	return thing;
}

// Good
function(data) {
	return data.thing;
}

// Bad
define(['N/record', 'N/search'], function (record,search) {

// Good
define([
        'N/record',
        'N/search'
    ], function (
        record,
        search
    ) {
```

Leading Operator
- No leading comma or operator

Strings
- Use single quotes
```javascript
// Good
var stuff = 'things';

// Bad
var stuff = "things";
```

Arrays
- Use literal syntax
```javascript
// Good
var list = [
	'apples',
	'oranges'
];

// Bad
var list = new Array();
```

Objects
- Use literal syntax
- Do not use quotes for property name unless absolutely necessary
```javascript
// Good
var obj = {
	meal: 'chicken wings',
	side: 'celery'
};

// Bad
var obj = new Object();

// Also Bad
var obj = {
	'meal': 'chicken wings',
	'side': 'celery'
};

// Very Bad
var obj = {
	"meal": "chicken wings",
	"side": "celery"
};
```

Comparison Operators
- Make sure to use the proper comparison operator (IE `=` vs `==` vs `===`). Generally, use `===` or `!==` if negative.
- For more information, see this helpful [article](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness)

File Naming Convention
- Files should be named with record type, script type and primary action separated by underscores. Examples below
	+ Devma_SuperUsers_SLT_GetInfo.js
	+ Devma_Item_UE_UpdateSCL.js

Indentation
- Always use tabs
- If line needs to be broken up due to length, break line up after the operator or comma and tab indent second line (no leading comma or operator)
```javascript
// Good
var list = [
	'Johnny',
	'Mary',
	'Jeff',
	'Sally,'
];

// Bad
var list = [
	'Johnny'
	, 'Mary'
	, 'Jeff'
	, 'Sally,'
];

// Good
var chickenBeforeEgg = chicken.created < egg.created ?
	chicken : egg;

// Bad
var chickenBeforeEgg = chicken.created < egg.created
	? chicken : egg;
```

SuiteScript
- Services and Backend Modesl should be written in SS1.0
- All new supporting scripts on the backend should be in SS2.0


Commenting
- Please use JSDoc format for commenting all functions and files
- Please make all comments clear and descriptive as if the person reading it knows nothing about the feature
- All code should be self commenting in nature. This means, as one reads the code, the variable/function names and parameters should be clear what it's purpose is
- For any code snippet that you feel isn't self explanatory, add an explanation
- When in doubt, comment

## Example Bash Profile for Mac
- Generally, it is recommended to use bash as the default terminal language. If you use zshell, these instructions will work but you will need a different default file.
- If you dont already have a `.bash_profile` file, create one by navigating to your root (`cd ~/`) then running `touch .bash_profile`
- Next, run `nano .bash_profile`
- Paste the following code into the `.bash_profile`. Note: this assumes your repositories are stored in a directory named `code` in the root. You may need to update the file path to fit your setup.
```bash

# navigate to txsmartbuy suitescript repository and open with VS Code
alias suitescripts="cd ~/code/suitescripts && code ."

# shortcut for gulp extension:local
alias gel="gulp extension:local"

# shortcut for gulp theme:local
alias gtl="gulp theme:local"

# shortcut for gulp local
alias gl="gulp local"

# shortcut for gulp extension:deploy
alias ged="gulp extension:deploy"

# shortcut for gulp theme:deploy
alias gtd="gulp theme:deploy"

# shortcut for gulp deploy
alias gd="gulp deploy"

# shortcut to open the vs code keyboard shortcuts for mac in your default browser
alias vsshort="open https://code.visualstudio.com/shortcuts/keyboard-shortcuts-macos.pdf"

# shortcut to open bash_profile
alias updatebp="nano ~/.bash_profile"

# shortcut to handle pruning local branches
function git-prune-branches() {
        echo "switching to master or main branch.."
        git branch | grep 'main\|master' | xargs -n 1 git checkout
        echo "pulling...";
        git pull
        echo "fetching with -p option...";
        git fetch -p;
        echo "running pruning of local branches"
        git branch -vv | grep ': gone]'|  grep -v "\*" | awk '{ print $1; }' | xargs -r git branch -d ;
}
alias gpb="git-prune-branches"

```
- When done pasting, press `ctrl + X` then `Y` to save your changes
- Lastly, for the first 5 commands to work, open your VS Code and press `CMD + SHIFT + P` then type install 'code' command in PATH. This will prompt you for your password. 
- You will need to quit your terminal, re-open and enjoy your new shortcuts.

## Additional Resources
- For further reading: [SuiteCommerce Developers](https://developers.suitecommerce.com/section1510956587)
- [Map/Reduce Documentation](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_4387799161.html)
- For how to develop an extension or more information on the development commands, see this [article](https://developers.suitecommerce.com/develop-your-first-extension.html)  
- For SuiteCommerce Advanced Training, see this [article](https://developers.suitecommerce.com/getting-started.html)
- [AirBNB Style Guide](https://github.com/airbnb/javascript/tree/es5-deprecated/es5)
- [Git Documentation](https://git-scm.com/about)