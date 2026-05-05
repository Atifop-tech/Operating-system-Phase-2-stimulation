const fileInput = document.getElementById("fileInput");
const fileLabel = document.querySelector("#fileLabel span");
const filePreview = document.getElementById("filePreview");
const previewContainer = document.getElementById("previewContainer");
const fileNameDisplay = document.getElementById("fileNameDisplay");
const runBtn = document.getElementById("runBtn");
const outputBox = document.getElementById("outputBox");
const loader = document.getElementById("loader");

fileInput.addEventListener("change", function() {
    const file = fileInput.files[0];
    if (file) {
        fileLabel.textContent = file.name;
        fileNameDisplay.textContent = `(${file.name})`;
        runBtn.disabled = false;
        
        // Read file for preview
        const reader = new FileReader();
        reader.onload = function(e) {
            filePreview.textContent = e.target.result;
            previewContainer.style.display = "block";
        };
        reader.readAsText(file);
    } else {
        fileLabel.textContent = "Choose a file or drag it here";
        previewContainer.style.display = "none";
        runBtn.disabled = true;
    }
});

function uploadFile() {
    const file = fileInput.files[0];

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
    runBtn.disabled = true;

    fetch("/run", {
        method: "POST",
        body: formData
    })
    .then(res => res.text())
    .then(data => {
        loader.style.display = "none";
        outputBox.textContent = data;
        runBtn.disabled = false;
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
}

function copyOutput() {
    if (outputBox.classList.contains("placeholder-text") || !outputBox.textContent) {
        return;
    }
    navigator.clipboard.writeText(outputBox.textContent).then(() => {
        alert("Output copied to clipboard!");
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