document.addEventListener('DOMContentLoaded', function () {
    const htmlElement = document.documentElement;
    const sizes = ['', 'font-size-md', 'font-size-lg'];
    let currentIdx = parseInt(localStorage.getItem('fontSizeIdx')) || 0;

    // Apply stored size on load
    if (currentIdx > 0) {
        htmlElement.classList.add(sizes[currentIdx]);
    }

    const accessibilityControls = document.createElement('div');
    accessibilityControls.id = 'accessibility-controls';
    accessibilityControls.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
    `;

    const button = document.createElement('button');
    button.innerHTML = '<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1;"><span style="font-size: 12px; opacity: 0.8;">A</span><span style="font-size: 20px; font-weight: bold;">A</span></div>';
    button.title = 'Adjust Font Size';
    button.ariaLabel = 'Increase or Reset Font Size';
    button.style.cssText = `
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: var(--brand-green);
        color: white;
        border: 4px solid white;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    `;

    button.onmouseover = () => {
        button.style.transform = 'scale(1.1) translateY(-5px)';
        button.style.backgroundColor = 'var(--brand-green-dark)';
    };
    button.onmouseout = () => {
        button.style.transform = 'scale(1) translateY(0)';
        button.style.backgroundColor = 'var(--brand-green)';
    };

    button.onclick = function () {
        // Remove current class
        if (sizes[currentIdx]) {
            htmlElement.classList.remove(sizes[currentIdx]);
        }

        // Increment index
        currentIdx = (currentIdx + 1) % sizes.length;

        // Add new class
        if (sizes[currentIdx]) {
            htmlElement.classList.add(sizes[currentIdx]);
        }

        // Save to localStorage
        localStorage.setItem('fontSizeIdx', currentIdx);

        // Pulse effect
        button.style.transform = 'scale(0.9)';
        setTimeout(() => {
            button.style.transform = 'scale(1.1) translateY(-5px)';
        }, 100);
    };

    accessibilityControls.appendChild(button);
    document.body.appendChild(accessibilityControls);
});
