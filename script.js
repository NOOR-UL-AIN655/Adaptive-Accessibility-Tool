
"use strict";

// ==========================================
// 1. SELECT HTML ELEMENTS
// ==========================================

const testsCount = document.getElementById("tests-count");
const passedCount = document.getElementById("passed-count");
const issuesCount = document.getElementById("issues-count");

const dialog = document.getElementById("test-dialog");
const openDialogButton = document.getElementById("open-dialog");
const closeDialogButton = document.getElementById("close-dialog");
const dialogInput = document.getElementById("dialog-input");

const reportOutput = document.getElementById("report-output");
const reportButton = document.getElementById("generate-report");

const foregroundInput = document.getElementById("foreground");
const backgroundInput = document.getElementById("background");
const contrastPreview = document.getElementById("contrast-preview");
const contrastRatio = document.getElementById("contrast-ratio");
const normalStatus = document.getElementById("normal-contrast-status");
const largeStatus = document.getElementById("large-contrast-status");
const contrastResult = document.getElementById("contrast-result");
const contrastButton = document.getElementById("check-contrast");

const axeButton = document.getElementById("run-axe-test");
const axeResult = document.getElementById("axe-result");
const axeDetails = document.getElementById("axe-details");

// Screen reader assistance elements
const listenPageButton = document.getElementById("listen-page");
const stopSpeakingButton = document.getElementById("stop-speaking");
const screenReaderHelpButton = document.getElementById("screenreader-help");
const speechStatus = document.getElementById("speech-status");


// ==========================================
// 2. STORE RESULTS AND UPDATE SUMMARY
// ==========================================

const auditResults = {};

function saveResult(id, title, status, details, issues = []) {
    auditResults[id] = {
        title,
        status,
        details,
        issues,
        time: new Date().toLocaleString()
    };

    updateSummary();
}

function updateSummary() {
    const results = Object.values(auditResults);

    if (testsCount) {
        testsCount.textContent = results.length;
    }

    if (passedCount) {
        passedCount.textContent = results.filter(
            result => result.status === "PASS"
        ).length;
    }

    if (issuesCount) {
        issuesCount.textContent = results.filter(
            result => result.status === "FAIL"
        ).length;
    }
}

function showResult(elementId, message, status = "info") {
    const element = document.getElementById(elementId);

    if (!element) return;

    element.textContent = message;
    element.classList.remove("success", "error");

    if (status === "PASS") {
        element.classList.add("success");
    } else if (status === "FAIL") {
        element.classList.add("error");
    }
}


// ==========================================
// 3. KEYBOARD NAVIGATION CHECK
// ==========================================

function testKeyboardNavigation() {
    const focusableElements = [
        ...document.querySelectorAll(
            'a[href], button:not(:disabled), input:not(:disabled), ' +
            'select:not(:disabled), textarea:not(:disabled), ' +
            '[tabindex]:not([tabindex="-1"])'
        )
    ].filter(element =>
        !element.closest("dialog") &&
        !element.closest("[hidden]") &&
        element.getAttribute("aria-hidden") !== "true"
    );

    const findings = [];

    const positiveTabIndex = focusableElements.filter(element =>
        Number(element.getAttribute("tabindex")) > 0
    );

    if (focusableElements.length === 0) {
        findings.push("No keyboard-focusable elements were detected.");
    }

    if (positiveTabIndex.length > 0) {
        findings.push(
            `${positiveTabIndex.length} element(s) use a positive tabindex.`
        );
    }

    const status = findings.length ? "FAIL" : "REVIEW";

    const message = findings.length
        ? findings.join(" ")
        : `${focusableElements.length} focusable elements found. ` +
          "Manually test Tab, Shift+Tab, Enter and Space.";

    showResult("keyboard-result", message, status);

    saveResult(
        "keyboard",
        "Keyboard Navigation",
        status,
        message,
        findings.length
            ? findings
            : ["Manual keyboard navigation testing is required."]
    );
}


// ==========================================
// 4. DIALOG FOCUS MANAGEMENT
// ==========================================

let dialogOpener = null;

function openTestDialog() {
    if (!dialog) return;

    dialogOpener = document.activeElement;

    if (typeof dialog.showModal !== "function") {
        const message = "This browser does not support modal dialogs.";

        showResult("focus-result", message, "FAIL");

        saveResult(
            "focus",
            "Dialog Focus Management",
            "FAIL",
            message
        );

        return;
    }

    dialog.showModal();

    if (dialogInput) {
        dialogInput.focus();
    }

    showResult(
        "focus-result",
        "Dialog opened. Test Tab, Shift+Tab and Escape."
    );
}

function closeTestDialog() {
    if (dialog && dialog.open) {
        dialog.close();
    }
}

if (openDialogButton) {
    openDialogButton.addEventListener("click", openTestDialog);
}

if (closeDialogButton) {
    closeDialogButton.addEventListener("click", closeTestDialog);
}

if (dialog) {
    dialog.addEventListener("keydown", event => {
        if (event.key !== "Tab") return;

        const focusable = [
            ...dialog.querySelectorAll(
                'a[href], button:not(:disabled), input:not(:disabled), ' +
                'select:not(:disabled), textarea:not(:disabled), ' +
                '[tabindex]:not([tabindex="-1"])'
            )
        ].filter(element =>
            !element.hidden &&
            element.getAttribute("aria-hidden") !== "true"
        );

        if (!focusable.length) {
            event.preventDefault();
            dialog.focus();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (
            event.shiftKey &&
            (document.activeElement === first ||
             !dialog.contains(document.activeElement))
        ) {
            event.preventDefault();
            last.focus();
        } else if (
            !event.shiftKey &&
            (document.activeElement === last ||
             !dialog.contains(document.activeElement))
        ) {
            event.preventDefault();
            first.focus();
        }
    });

    dialog.addEventListener("close", () => {
        if (dialogOpener && dialogOpener.isConnected) {
            dialogOpener.focus();
        }

        const message =
            "Dialog closed. Verify focus restoration manually.";

        showResult("focus-result", message, "REVIEW");

        saveResult(
            "focus",
            "Dialog Focus Management",
            "REVIEW",
            message,
            ["Manually verify focus trapping and restoration."]
        );
    });
}


// ==========================================
// 5. SCREEN READER SUPPORT CHECK
// ==========================================

function testScreenReaderSupport() {
    const findings = [];

    document.querySelectorAll("img").forEach(image => {
        if (!image.hasAttribute("alt")) {
            findings.push("An image is missing its alt attribute.");
        }
    });

    function hasAccessibleName(element) {
        if (element.labels && element.labels.length > 0) {
            return true;
        }

        if (element.getAttribute("aria-label")?.trim()) {
            return true;
        }

        const labelledBy = element.getAttribute("aria-labelledby");

        if (!labelledBy) return false;

        return labelledBy.split(/\s+/).some(id => {
            const label = document.getElementById(id);
            return label && label.textContent.trim().length > 0;
        });
    }

    document.querySelectorAll(
        'input:not([type="hidden"]), select, textarea'
    ).forEach(control => {
        if (!hasAccessibleName(control)) {
            findings.push(
                `Form control "${control.id || control.tagName}" ` +
                "may not have an accessible name."
            );
        }
    });

    document.querySelectorAll("button").forEach(button => {
        const hasText = button.textContent.trim().length > 0;
        const hasAriaLabel = button.getAttribute("aria-label")?.trim();

        const labelledBy = button.getAttribute("aria-labelledby");

        const hasLabelledBy = labelledBy &&
            labelledBy.split(/\s+/).some(id => {
                const label = document.getElementById(id);
                return label && label.textContent.trim().length > 0;
            });

        if (!hasText && !hasAriaLabel && !hasLabelledBy) {
            findings.push("A button may be missing its accessible name.");
        }
    });

    const status = findings.length ? "FAIL" : "REVIEW";

    const message = findings.length
        ? findings.join(" ")
        : "Basic accessible-name checks completed. " +
          "Manual screen reader testing is still required.";

    showResult("screenreader-result", message, status);

    saveResult(
        "screenreader",
        "Screen Reader Support",
        status,
        message,
        findings.length
            ? findings
            : ["Manual screen reader testing is required."]
    );
}


// ==========================================
// 6. COLOR CONTRAST CALCULATOR + LIVE PREVIEW
// ==========================================

function linearizeColor(value) {
    const channel = value / 255;

    return channel <= 0.04045
        ? channel / 12.92
        : Math.pow((channel + 0.055) / 1.055, 2.4);
}

function getLuminance(hexColor) {
    const hex = hexColor.replace("#", "");

    const red = parseInt(hex.slice(0, 2), 16);
    const green = parseInt(hex.slice(2, 4), 16);
    const blue = parseInt(hex.slice(4, 6), 16);

    return (
        0.2126 * linearizeColor(red) +
        0.7152 * linearizeColor(green) +
        0.0722 * linearizeColor(blue)
    );
}

function calculateContrast(color1, color2) {
    const luminance1 = getLuminance(color1);
    const luminance2 = getLuminance(color2);

    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);

    return (lighter + 0.05) / (darker + 0.05);
}

function updateContrastPreview() {
    if (
        !foregroundInput ||
        !backgroundInput ||
        !contrastPreview ||
        !contrastRatio ||
        !normalStatus ||
        !largeStatus ||
        !contrastResult
    ) {
        return null;
    }

    const foreground = foregroundInput.value;
    const background = backgroundInput.value;

    contrastPreview.style.color = foreground;
    contrastPreview.style.backgroundColor = background;

    const ratio = calculateContrast(foreground, background);

    const normalPass = ratio >= 4.5;
    const largePass = ratio >= 3;

    contrastRatio.textContent = `Contrast Ratio: ${ratio.toFixed(2)}:1`;

    normalStatus.textContent = normalPass
        ? "Normal Text (4.5:1): PASS"
        : "Normal Text (4.5:1): FAIL";

    normalStatus.style.color = normalPass ? "green" : "red";

    largeStatus.textContent = largePass
        ? "Large Text (3:1): PASS"
        : "Large Text (3:1): FAIL";

    largeStatus.style.color = largePass ? "green" : "red";

    const overallPass = normalPass && largePass;

    contrastResult.textContent = overallPass
        ? "PASS: Both contrast requirements are met."
        : "FAIL: One or more contrast requirements are not met.";

    contrastResult.style.color = overallPass ? "green" : "red";

    return {
        ratio,
        normalPass,
        largePass,
        overallPass
    };
}

function testColorContrast() {
    const result = updateContrastPreview();

    if (!result) return;

    const { ratio, normalPass, largePass, overallPass } = result;

    const message =
        `Contrast ratio: ${ratio.toFixed(2)}:1. ` +
        `Normal text (4.5:1): ${normalPass ? "PASS" : "FAIL"}. ` +
        `Large text (3:1): ${largePass ? "PASS" : "FAIL"}.`;

    const issues = [];

    if (!normalPass) {
        issues.push(
            "Normal text contrast is below the WCAG AA threshold of 4.5:1."
        );
    }

    if (!largePass) {
        issues.push(
            "Large text contrast is below the WCAG AA threshold of 3:1."
        );
    }

    showResult(
        "contrast-result",
        overallPass
            ? "PASS: Both contrast requirements are met."
            : "FAIL: One or more contrast requirements are not met.",
        overallPass ? "PASS" : "FAIL"
    );

    saveResult(
        "contrast",
        "Color Contrast",
        overallPass ? "PASS" : "FAIL",
        message,
        issues
    );
}

if (foregroundInput) {
    foregroundInput.addEventListener("input", updateContrastPreview);
    foregroundInput.addEventListener("change", updateContrastPreview);
}

if (backgroundInput) {
    backgroundInput.addEventListener("input", updateContrastPreview);
    backgroundInput.addEventListener("change", updateContrastPreview);
}

if (contrastButton) {
    contrastButton.addEventListener("click", testColorContrast);
}

updateContrastPreview();


// ==========================================
// 7. COMMON UI ACCESSIBILITY SCAN
// ==========================================

function scanUIIssues() {
    const findings = [];

    document.querySelectorAll("img").forEach(image => {
        if (!image.hasAttribute("alt")) {
            findings.push("Image is missing alt text.");
        }
    });

    document.querySelectorAll(
        'input:not([type="hidden"]), select, textarea'
    ).forEach(control => {
        const hasLabel = control.labels && control.labels.length > 0;
        const hasAriaLabel = Boolean(
            control.getAttribute("aria-label")?.trim()
        );

        const labelledBy = control.getAttribute("aria-labelledby");

        const hasLabelledBy = labelledBy &&
            labelledBy.split(/\s+/).some(id => {
                const label = document.getElementById(id);
                return label && label.textContent.trim().length > 0;
            });

        if (!hasLabel && !hasAriaLabel && !hasLabelledBy) {
            findings.push(
                `Form field "${control.id || "unnamed"}" may be missing a label.`
            );
        }
    });

    document.querySelectorAll("button").forEach(button => {
        const hasName =
            button.textContent.trim() ||
            button.getAttribute("aria-label")?.trim() ||
            button.getAttribute("aria-labelledby");

        if (!hasName) {
            findings.push("Button may be missing an accessible name.");
        }
    });

    document.querySelectorAll("[tabindex]").forEach(element => {
        if (Number(element.getAttribute("tabindex")) > 0) {
            findings.push(`Positive tabindex found on ${element.tagName}.`);
        }
    });

    document.querySelectorAll("a").forEach(link => {
        if (!link.hasAttribute("href")) {
            findings.push("Link is missing an href attribute.");
        }
    });

    const status = findings.length ? "FAIL" : "REVIEW";

    const message = findings.length
        ? `${findings.length} potential issue(s): ${findings.join(" ")}`
        : "No issues found by these basic checks. " +
          "Manual and automated testing is still recommended.";

    showResult("ui-result", message, status);

    saveResult(
        "ui",
        "Common UI Issues",
        status,
        message,
        findings.length
            ? findings
            : ["Additional manual accessibility checks are recommended."]
    );
}


// ==========================================
// 8. ARROW-KEY TAB NAVIGATION
// ==========================================

const tabs = [
    document.getElementById("tab-one"),
    document.getElementById("tab-two"),
    document.getElementById("tab-three")
];

const panels = [
    document.getElementById("panel-one"),
    document.getElementById("panel-two"),
    document.getElementById("panel-three")
];

function activateTab(index, moveFocus = true) {
    tabs.forEach((tab, i) => {
        if (!tab || !panels[i]) return;

        const selected = i === index;

        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        panels[i].hidden = !selected;
    });

    if (moveFocus && tabs[index]) {
        tabs[index].focus();
    }
}

tabs.forEach((tab, index) => {
    if (!tab) return;

    tab.addEventListener("click", () => {
        activateTab(index, false);
    });

    tab.addEventListener("keydown", event => {
        let nextIndex = index;

        if (event.key === "ArrowRight") {
            nextIndex = (index + 1) % tabs.length;
        } else if (event.key === "ArrowLeft") {
            nextIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (event.key === "Home") {
            nextIndex = 0;
        } else if (event.key === "End") {
            nextIndex = tabs.length - 1;
        } else {
            return;
        }

        event.preventDefault();
        activateTab(nextIndex);
    });
});


// ==========================================
// 9. GENERATE AND DOWNLOAD AUDIT REPORT
// ==========================================

function generateAuditReport() {
    const results = Object.values(auditResults);

    if (!reportOutput) return;

    if (results.length === 0) {
        reportOutput.textContent =
            "No tests have been run yet. Run the accessibility tests first.";

        reportOutput.focus();
        return;
    }

    const passed = results.filter(
        result => result.status === "PASS"
    ).length;

    const failed = results.filter(
        result => result.status === "FAIL"
    ).length;

    const review = results.filter(
        result => result.status === "REVIEW"
    ).length;

    const report = {
        reportTitle: "Adaptive Accessibility Tool Audit Report",
        generatedAt: new Date().toISOString(),
        standard: "WCAG 2.2 AA target",
        note:
            "This report includes recorded checks only. " +
            "It does not certify full WCAG conformance.",
        summary: {
            testsRun: results.length,
            passed,
            failed,
            requiresReview: review
        },
        results
    };

    reportOutput.replaceChildren();

    const heading = document.createElement("h3");
    heading.textContent = "Audit Summary";

    const totals = document.createElement("p");
    totals.textContent =
        `Tests run: ${results.length} | Passed: ${passed} | ` +
        `Failed: ${failed} | Requires review: ${review}`;

    reportOutput.append(heading, totals);

    results.forEach(result => {
        const item = document.createElement("article");
        item.className = "report-item";

        const title = document.createElement("h4");
        title.textContent = `${result.title} — ${result.status}`;

        const details = document.createElement("p");
        details.textContent = result.details;

        item.append(title, details);

        if (result.issues && result.issues.length > 0) {
            const list = document.createElement("ul");

            result.issues.forEach(issue => {
                const listItem = document.createElement("li");

                listItem.textContent = typeof issue === "string"
                    ? issue
                    : JSON.stringify(issue);

                list.appendChild(listItem);
            });

            item.appendChild(list);
        }

        const time = document.createElement("p");
        time.textContent = `Recorded: ${result.time}`;
        item.appendChild(time);

        reportOutput.appendChild(item);
    });

    const file = new Blob(
        [JSON.stringify(report, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(file);
    const downloadLink = document.createElement("a");

    downloadLink.href = url;
    downloadLink.download = "accessibility-audit-report.json";
    downloadLink.textContent = "Download Audit Report (JSON)";

    reportOutput.appendChild(downloadLink);
    reportOutput.focus();

    setTimeout(() => URL.revokeObjectURL(url), 60000);
}


// ==========================================
// 10. CONNECT TEST BUTTONS
// ==========================================

document.querySelectorAll('[data-test="keyboard"]').forEach(button => {
    button.addEventListener("click", testKeyboardNavigation);
});

document.querySelectorAll('[data-test="screenreader"]').forEach(button => {
    button.addEventListener("click", testScreenReaderSupport);
});

document.querySelectorAll('[data-test="ui"]').forEach(button => {
    button.addEventListener("click", scanUIIssues);
});

if (reportButton) {
    reportButton.addEventListener("click", generateAuditReport);
}


// ==========================================
// 11. AXE-CORE AUTOMATED ACCESSIBILITY SCAN
// ==========================================

if (axeButton && axeResult && axeDetails) {
    axeButton.addEventListener("click", async () => {
        axeButton.disabled = true;
        axeResult.textContent = "Scanning page...";
        axeDetails.replaceChildren();

        try {
            if (typeof axe === "undefined") {
                throw new Error(
                    "axe-core did not load. Check your internet connection."
                );
            }

            const results = await axe.run(document, {
                runOnly: {
                    type: "tag",
                    values: [
                        "wcag2a",
                        "wcag2aa",
                        "wcag21a",
                        "wcag21aa",
                        "wcag22aa"
                    ]
                }
            });

            const violations = results.violations;

            const issues = violations.map(violation =>
                `${(violation.impact || "unknown").toUpperCase()}: ` +
                `${violation.help} | ` +
                `Affected elements: ${violation.nodes.length} | ` +
                `Help: ${violation.helpUrl}`
            );

            const status = violations.length ? "FAIL" : "PASS";

            const message =
                `${violations.length} violation(s), ` +
                `${results.passes.length} passed rule(s), ` +
                `${results.incomplete.length} needs manual review.`;

            saveResult(
                "axe",
                "axe-core Automated Scan",
                status,
                message,
                issues
            );

            axeResult.textContent = `${status}: ${message}`;

            if (violations.length === 0) {
                const note = document.createElement("p");

                note.textContent =
                    "No axe-core violations were detected. " +
                    "Manual accessibility testing is still needed.";

                axeDetails.appendChild(note);
            }

            violations.forEach(violation => {
                const section = document.createElement("section");

                const heading = document.createElement("h4");
                heading.textContent =
                    `${violation.impact || "Unknown"}: ${violation.id}`;

                const description = document.createElement("p");
                description.textContent = violation.help;

                const affected = document.createElement("p");
                affected.textContent =
                    `Affected elements: ${violation.nodes.length}`;

                const link = document.createElement("a");
                link.textContent = "How to fix this issue";
                link.href = violation.helpUrl;
                link.target = "_blank";
                link.rel = "noopener noreferrer";

                section.append(heading, description, affected, link);
                axeDetails.appendChild(section);
            });
        } catch (error) {
            axeResult.textContent =
                `Scan could not run: ${error.message}`;

            console.error("Axe-core scan error:", error);
        } finally {
            axeButton.disabled = false;
        }
    });
}


// ==========================================
// 12. INITIALIZE DASHBOARD
// ==========================================

updateSummary();


// ==========================================
// 13. WEBSITE THEME SWITCHER
// ==========================================

const themeSelector = document.getElementById("theme-selector");
const themeStatus = document.getElementById("theme-status");

const availableThemes = [
    "light",
    "dark",
    "sepia",
    "high-contrast"
];

function applyTheme(theme, announce = true) {
    if (!availableThemes.includes(theme)) {
        theme = "light";
    }

    document.body.setAttribute("data-theme", theme);

    if (themeSelector) {
        themeSelector.value = theme;
    }

    try {
        localStorage.setItem("accessibility-tool-theme", theme);
    } catch (error) {
        console.warn("Theme preference could not be saved.", error);
    }

    if (themeStatus && announce) {
        const themeNames = {
            light: "Light",
            dark: "Dark",
            sepia: "Sepia",
            "high-contrast": "High Contrast"
        };

        themeStatus.textContent =
            `${themeNames[theme]} theme selected`;
    }
}

function initializeTheme() {
    let savedTheme = "light";

    try {
        const storedTheme = localStorage.getItem(
            "accessibility-tool-theme"
        );

        if (storedTheme && availableThemes.includes(storedTheme)) {
            savedTheme = storedTheme;
        }
    } catch (error) {
        console.warn("Saved theme could not be loaded.", error);
    }

    applyTheme(savedTheme, false);
}

if (themeSelector) {
    themeSelector.addEventListener("change", function () {
        applyTheme(themeSelector.value);
    });
}

initializeTheme();


// ==========================================
// 14. SCREEN READER ASSISTANCE
// ==========================================

// Check whether the browser supports speech.
const speechSupported = "speechSynthesis" in window;

// Speak text using the browser's speech engine.
function speakText(text) {
    if (!speechStatus) return;

    if (!speechSupported) {
        speechStatus.textContent =
            "Speech is not supported by this browser. " +
            "Please use a supported browser or an operating system screen reader.";
        return;
    }

    // Stop any speech that is already playing.
    window.speechSynthesis.cancel();

    const speech = new SpeechSynthesisUtterance(text);

    speech.lang = "en-US";
    speech.rate = 1;
    speech.pitch = 1;

    speech.onstart = function () {
        speechStatus.textContent = "Speaking...";
    };

    speech.onend = function () {
        speechStatus.textContent = "Finished speaking.";
    };

    speech.onerror = function (event) {
        // Cancellation is intentional when the user presses Stop.
        if (event.error === "canceled" ||
            event.error === "interrupted") {
            return;
        }

        speechStatus.textContent =
            "Speech could not be played. Please try again.";
    };

    window.speechSynthesis.speak(speech);
}


// LISTEN TO PAGE
if (listenPageButton) {
    listenPageButton.addEventListener("click", function () {
        const mainContent = document.getElementById("main-content");

        if (!mainContent) return;

        // Read the main page content, excluding hidden panels.
        const pageText = mainContent.innerText.trim();

        if (!pageText) {
            speechStatus.textContent = "No page text is available to read.";
            return;
        }

        speakText(
            "Welcome to the Adaptive Accessibility Tool. " + pageText
        );
    });
}


// STOP SPEAKING
if (stopSpeakingButton) {
    stopSpeakingButton.addEventListener("click", function () {
        if (speechSupported) {
            window.speechSynthesis.cancel();
            speechStatus.textContent = "Speech stopped.";
        } else if (speechStatus) {
            speechStatus.textContent =
                "Speech is not supported by this browser.";
        }
    });
}


// SCREEN READER HELP
if (screenReaderHelpButton) {
    screenReaderHelpButton.addEventListener("click", function () {
        const instructions =
            "Screen reader help. " +
            "On Windows, press the Windows key, Control key, and Enter " +
            "together to turn Windows Narrator on or off. " +
            "Use the Tab key to move between buttons, links, and form controls. " +
            "Press Enter to activate a button or open a link. " +
            "Use Shift and Tab to move backwards. " +
            "On supported tab controls, use the left and right arrow keys. " +
            "You can also select Listen to Page to hear the website text. " +
            "Select Stop Speaking to stop this website's speech.";

        speakText(instructions);
    });
}