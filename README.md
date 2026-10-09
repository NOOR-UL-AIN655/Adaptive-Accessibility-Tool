# Adaptive Accessibility Tool

An interactive web-based tool designed to help identify common website accessibility issues and improve the experience for keyboard and assistive-technology users.

## Features

* **Keyboard Navigation:** Check keyboard accessibility and navigation.
* **Focus Management:** Test focus behavior when opening and closing a dialog.
* **Screen Reader Support:** Check accessible names and provide browser-based text-to-speech assistance.
* **Color Contrast Checker:** Evaluate foreground and background color contrast.
* **Common UI Checks:** Inspect common accessibility issues in interface elements.
* **Automated Accessibility Scan:** Run an automated scan using axe-core.
* **Theme Customization:** Switch between Light, Dark, Sepia, and High Contrast themes.
* **Audit Summary:** Review accessibility test results.
* **JSON Report:** Download a report of the audit results.

## Technologies Used

* HTML5
* CSS3
* JavaScript
* axe-core
* Web Speech API
* Local Storage

## Project Structure

```text
adaptive-accessibility-tool/
├── index.html
├── style.css
├── script.js
└── README.md
```

Add any other required project files or folders to the repository if your project uses them.

## How to Run

1. Clone or download this repository.
2. Open the project folder in Visual Studio Code.
3. Install the Live Server extension if needed.
4. Right-click `index.html`.
5. Select **Open with Live Server**.
6. Use the interface to run the available accessibility checks.

An internet connection may be required to load axe-core from its CDN.

## Important Notes

This tool provides basic accessibility checks and automated scan results. Automated testing cannot guarantee full WCAG compliance. Manual keyboard testing, screen reader testing, and further accessibility evaluation are also recommended.

Browser-based text-to-speech assistance is not a replacement for a full operating-system screen reader.

## Future Improvements

* Additional WCAG accessibility checks
* Improved audit reporting
* More detailed accessibility guidance
* Enhanced screen reader and keyboard testing

## Author

Noor-ul-Ain
