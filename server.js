const express = require('express');
const fs = require('fs');
const { exec } = require('child_process');
const multer = require('multer');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

// Upload + Run
app.post('/run', upload.single('file'), (req, res) => {

    const inputPath = req.file.path;

    // Copy uploaded file to input.txt
    fs.copyFileSync(inputPath, 'input.txt');
    
    // Clean up the uploaded temporary file
    fs.unlinkSync(inputPath);

    // Compile and run C++ code
    exec('g++ "phase2.cpp" -o "phase2.exe"', (compileErr, _, compileStderr) => {

    if (compileErr) {
        return res.send("Compilation Error:\n" + compileStderr);
    }

    exec('phase2.exe', (runErr, stdout, runStderr) => {

        if (runErr) {
            return res.send("Runtime Error:\n" + runStderr);
        }

        try {
            const output = fs.readFileSync('output.txt', 'utf-8');
            res.send(output);
        } catch {
            res.send("Program ran but no output generated.");
        }
    });
});
});


app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});