document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navbar Toggle
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelector('.nav-links');
    if (navbar && navLinks) {
        const navToggleBtn = document.createElement('button');
        navToggleBtn.className = 'nav-toggle';
        navToggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        navbar.insertBefore(navToggleBtn, navbar.children[1]);

        navToggleBtn.addEventListener('click', () => {
            navLinks.classList.toggle('show-nav');
        });
    }

    // Image Upload and Canvas Setup
    const upload = document.getElementById('upload');
    const canvas = document.getElementById('canvas');
    const ctx = canvas?.getContext('2d');
    let img = new Image();
    let originalImage = null;
    let currentBrightness = 100;
    let currentContrast = 100;
    let currentSaturation = 100;
    
    if (upload && canvas && ctx) {
        upload.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;
    
            const reader = new FileReader();
            reader.onload = () => {
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            originalImage = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
            // Hide upload area
            const uploadArea = document.querySelector('.upload-area');
            if (uploadArea) {
                uploadArea.style.display = 'none';
            }
        };
    }
    
    // Toggle Edit Options Panel
    window.toggleEditOptions = () => {
        const options = document.getElementById('editOptions');
        if (options) {
            options.style.display = (options.style.display === 'none' || options.style.display === '') ? 'block' : 'none';
        }
    };

    // Apply Filter (Brightness, Saturation, Contrast)
    window.applyFilter = () => {
        currentBrightness = document.getElementById('brightnessRange')?.value || 100;
        currentContrast = document.getElementById('contrastRange')?.value || 100;
        currentSaturation = document.getElementById('saturationRange')?.value || 100;

        if (!canvas || !ctx || !originalImage) return;

        ctx.putImageData(originalImage, 0, 0); // Reset image
        ctx.filter = `brightness(${currentBrightness}%) contrast(${currentContrast}%) saturate(${currentSaturation}%)`;
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';
    };

    // Sharpness
    window.applySharpness = () => {
        const sharpnessValue = parseInt(document.getElementById('sharpness')?.value || '0', 10);
        if (!canvas || !ctx || sharpnessValue === 0) return;

        const weights = [
            0, -1,  0,
           -1,  5, -1,
            0, -1,  0
        ];

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;
        const copy = new Uint8ClampedArray(data);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                for (let c = 0; c < 3; c++) {
                    let i = (y * width + x) * 4 + c;
                    let sum = 0;
                    let k = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            let ni = ((y + dy) * width + (x + dx)) * 4 + c;
                            sum += copy[ni] * weights[k++];
                        }
                    }
                    data[i] = Math.min(255, Math.max(0, sum));
                }
            }
        }

        ctx.putImageData(imageData, 0, 0);
    };

    window.toggleEdit = () => {
        document.getElementById('editOptions')?.classList.toggle('active');
    };

    window.toggleEffects = () => {
        document.getElementById('effectsOptions')?.classList.toggle('active');
    };

    window.showCompressBar = () => {
        document.getElementById('compressOptions')?.classList.toggle('active');
    };

    window.compressImage = () => {
        const range = document.getElementById('compressRange');
        if (!range || !canvas || !ctx) return;
        const quality = range.value / 100;
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const tempImg = new Image();
        tempImg.onload = () => {
            canvas.width = tempImg.width;
            canvas.height = tempImg.height;
            ctx.drawImage(tempImg, 0, 0);
        };
        tempImg.src = dataUrl;
    };

    window.resetImage = () => {
        if (originalImage && ctx) {
            ctx.putImageData(originalImage, 0, 0);
        }
    };

    let textData = {
        text: '',
        x: 50,
        y: 50,
        size: 30,
        font: 'Arial',
        color: '#ffffff',
        isDragging: false
    };

    window.addText = () => {
        const text = document.getElementById('textInput')?.value;
        const size = parseInt(document.getElementById('fontSizeInput')?.value || '30');
        const font = document.getElementById('fontFamilyInput')?.value || 'Arial';
        const color = document.getElementById('fontColorInput')?.value || '#ffffff';
        const weight = document.getElementById('fontWeightInput')?.value || 'bold';

        if (text && ctx) {
            textData = { ...textData, text, size, font, color };
            redrawImageWithText();
        }
    };

    function redrawImageWithText() {
        if (!ctx || !img) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Reapply filter
        ctx.filter = `brightness(${currentBrightness}%) contrast(${currentContrast}%) saturate(${currentSaturation}%)`;
        ctx.drawImage(img, 0, 0);
        ctx.filter = 'none';

        if (textData.text) {
            ctx.font = `${textData.size}px ${textData.font}`;
            ctx.fillStyle = textData.color;
            ctx.fillText(textData.text, textData.x, textData.y);
        }
    }

    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        ctx.font = `${textData.size}px ${textData.font}`;
        const textWidth = ctx.measureText(textData.text).width;
        const textHeight = textData.size;

        if (
            mx >= textData.x &&
            mx <= textData.x + textWidth &&
            my <= textData.y &&
            my >= textData.y - textHeight
        ) {
            textData.isDragging = true;
            canvas.style.cursor = "grabbing";
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (textData.isDragging) {
            const rect = canvas.getBoundingClientRect();
            textData.x = e.clientX - rect.left;
            textData.y = e.clientY - rect.top;
            redrawImageWithText();
        }
    });

    canvas.addEventListener('mouseup', () => {
        textData.isDragging = false;
        canvas.style.cursor = "default";
    });

    window.applyEffect = (effect) => {
        if (!canvas || !ctx) return;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        if (effect === 'grayscale') {
            for (let i = 0; i < data.length; i += 4) {
                const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = data[i + 1] = data[i + 2] = avg;
            }
        }

        if (effect === 'sepia') {
            for (let i = 0; i < data.length; i += 4) {
                const red = data[i], green = data[i + 1], blue = data[i + 2];
                data[i]     = red * 0.393 + green * 0.769 + blue * 0.189;
                data[i + 1] = red * 0.349 + green * 0.686 + blue * 0.168;
                data[i + 2] = red * 0.272 + green * 0.534 + blue * 0.131;
            }
        }

        if (effect === 'invert') {
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];
                data[i + 1] = 255 - data[i + 1];
                data[i + 2] = 255 - data[i + 2];
            }
        }

        if (effect === 'blur') {
            ctx.filter = 'blur(2px)';
            ctx.drawImage(canvas, 0, 0);
            ctx.filter = 'none';
            return;
        }

        ctx.putImageData(imageData, 0, 0);
    };
    window.removeObject = async () => {
        const upload = document.getElementById('upload');
        if (!upload.files[0]) {
            alert("Please upload an image first!");
            return;
        }
    
        // Show loading indicator
        const loadingEl = document.createElement('div');
        loadingEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Removing background...';
        loadingEl.style.position = 'fixed';
        loadingEl.style.top = '50%';
        loadingEl.style.left = '50%';
        loadingEl.style.transform = 'translate(-50%, -50%)';
        loadingEl.style.background = 'rgba(0,0,0,0.8)';
        loadingEl.style.color = 'white';
        loadingEl.style.padding = '20px';
        loadingEl.style.borderRadius = '5px';
        loadingEl.style.zIndex = '9999';
        document.body.appendChild(loadingEl);
    
        const file = upload.files[0];
    
        // Convert to Base64
        const toBase64 = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]); // Remove prefix
            reader.onerror = error => reject(error);
        });
    
        try {
            const base64Image = await toBase64(file);
    
            const response = await fetch('/api/remove-bg', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_file_b64: base64Image,
                    size: 'auto'
                })
            });
    
            if (!response.ok) {
                throw new Error(`Serverless function error: ${response.status} ${response.statusText}`);
            }
    
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
    
            const newImg = new Image();
            newImg.onload = () => {
                const canvas = document.getElementById('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = newImg.width;
                canvas.height = newImg.height;
                ctx.drawImage(newImg, 0, 0);
                document.body.removeChild(loadingEl);
            };
            newImg.src = url;
    
        } catch (error) {
            document.body.removeChild(loadingEl);
            alert('Error: ' + error.message);
        }
    };
    
    window.downloadImage = () => {
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = 'edited-image.png';
        link.href = canvas.toDataURL();
        link.click();
    };

    window.convertToPDF = () => {
        if (!canvas || typeof window.jspdf === 'undefined') return;
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF();
        const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
        pdf.addImage(dataUrl, 'JPEG', 15, 15, 180, 160);
        pdf.save('image.pdf');
    };
});