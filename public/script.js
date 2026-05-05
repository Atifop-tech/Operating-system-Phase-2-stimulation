const fileInput = document.getElementById("fileInput");
const fileLabel = document.querySelector("#fileLabel span");
const filePreview = document.getElementById("filePreview");
const previewContainer = document.getElementById("previewContainer");
const fileNameDisplay = document.getElementById("fileNameDisplay");
const fileSizeDisplay = document.getElementById("fileSizeDisplay");
const runBtn = document.getElementById("runBtn");
const outputBox = document.getElementById("outputBox");
const loader = document.getElementById("loader");
const execTimeDisplay = document.getElementById("execTime");
const timeValue = document.getElementById("timeValue");
const dropZone = document.getElementById("dropZone");
const outputPanel = document.querySelector(".output-panel");
const fullscreenIcon = document.getElementById("fullscreenIcon");

let currentFile = null;

// Hardcoded samples for demonstration
const samples = {
    1: `$AMJ000100010000
GD10
PD10
H
$DTA
Hello World
$END`,
    2: `$AMJ000200020000
GD10
PD20
H
$DTA
Hello World
$END`
};

// Drag and Drop functionality
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
        dropZone.classList.add('dragover');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove('dragover');
    }, false);
});

dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        fileInput.files = files;
        handleFileSelect(files[0]);
    }
});

fileInput.addEventListener("change", function() {
    if (fileInput.files.length > 0) {
        handleFileSelect(fileInput.files[0]);
    }
});

function handleFileSelect(file) {
    if (!file.name.endsWith('.txt')) {
        alert("Please select a valid .txt file.");
        resetInput();
        return;
    }

    currentFile = file;
    fileLabel.textContent = file.name;
    fileNameDisplay.textContent = `(${file.name})`;
    
    // Calculate size
    const sizeKB = (file.size / 1024).toFixed(2);
    fileSizeDisplay.textContent = `${sizeKB} KB`;

    runBtn.disabled = false;
    
    // Read file for preview
    const reader = new FileReader();
    reader.onload = function(e) {
        filePreview.textContent = e.target.result;
        previewContainer.style.display = "block";
    };
    reader.readAsText(file);
}

function resetInput() {
    fileInput.value = "";
    currentFile = null;
    fileLabel.textContent = "Choose a file or drag it here";
    previewContainer.style.display = "none";
    runBtn.disabled = true;
}

function loadSample(sampleId) {
    const content = samples[sampleId];
    const fileName = `sample_job_${sampleId}.txt`;
    
    // Create a File object from the sample text
    const blob = new Blob([content], { type: 'text/plain' });
    const file = new File([blob], fileName, { type: 'text/plain', lastModified: new Date().getTime() });
    
    // Mock the file input behavior
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    fileInput.files = dataTransfer.files;
    
    handleFileSelect(file);
}

function uploadFile() {
    const file = currentFile || fileInput.files[0];

    if (!file) {
        alert("Please upload an input file.");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    // Show loader, clear previous output
    outputBox.textContent = "";
    outputBox.classList.remove("placeholder-text");
    loader.style.display = "block";
    execTimeDisplay.style.display = "none";
    runBtn.disabled = true;

    const startTime = performance.now();

    fetch("/run", {
        method: "POST",
        body: formData
    })
    .then(res => res.text())
    .then(data => {
        const endTime = performance.now();
        const timeTaken = (endTime - startTime).toFixed(0);
        
        loader.style.display = "none";
        outputBox.textContent = data || "Simulation completed with no output.";
        runBtn.disabled = false;
        
        // Update execution time
        timeValue.textContent = timeTaken;
        execTimeDisplay.style.display = "flex";
    })
    .catch(err => {
        loader.style.display = "none";
        outputBox.textContent = "Error executing the simulation.\n" + err;
        runBtn.disabled = false;
        console.error(err);
    });
}

function clearOutput() {
    outputBox.textContent = "Output will appear here...";
    outputBox.classList.add("placeholder-text");
    execTimeDisplay.style.display = "none";
}

function copyOutput() {
    if (outputBox.classList.contains("placeholder-text") || !outputBox.textContent) {
        return;
    }
    navigator.clipboard.writeText(outputBox.textContent).then(() => {
        const originalIcon = document.querySelector("button[title='Copy to clipboard'] i").className;
        document.querySelector("button[title='Copy to clipboard'] i").className = "fa-solid fa-check";
        setTimeout(() => {
            document.querySelector("button[title='Copy to clipboard'] i").className = originalIcon;
        }, 2000);
    }).catch(err => {
        console.error("Could not copy text: ", err);
    });
}

function downloadOutput() {
    if (outputBox.classList.contains("placeholder-text") || !outputBox.textContent) {
        return;
    }
    const text = outputBox.textContent;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "simulation_output.txt";
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function toggleFullscreen() {
    outputPanel.classList.toggle("fullscreen");
    if (outputPanel.classList.contains("fullscreen")) {
        fullscreenIcon.classList.remove("fa-expand");
        fullscreenIcon.classList.add("fa-compress");
        document.body.style.overflow = "hidden"; // Prevent background scrolling
    } else {
        fullscreenIcon.classList.remove("fa-compress");
        fullscreenIcon.classList.add("fa-expand");
        document.body.style.overflow = "auto";
    }
}