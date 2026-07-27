document.addEventListener("DOMContentLoaded", function () {

    function connectInput(inputId, previewId, defaultText) {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);

        if (!input || !preview) {
            console.error("Missing element:", inputId, previewId);
            return;
        }

        input.addEventListener("input", function () {
            preview.textContent =
                this.value.trim() || defaultText;
        });
    }


    // PERSONAL INFORMATION

    connectInput(
        "fullName",
        "previewName",
        "YOUR NAME"
    );

    connectInput(
        "jobTitle",
        "previewJob",
        "JOB TITLE"
    );

    connectInput(
        "email",
        "previewEmail",
        "email@example.com"
    );

    connectInput(
        "phone",
        "previewPhone",
        "+91 0000000000"
    );

    connectInput(
        "linkedin",
        "previewLinkedin",
        "LinkedIn"
    );

    connectInput(
        "github",
        "previewGithub",
        "GitHub"
    );

    connectInput(
        "summary",
        "previewSummary",
        "Your professional summary will appear here."
    );


    // EDUCATION

    const educationFields = [
        "college",
        "degree",
        "branch",
        "cgpa",
        "gradYear"
    ];

    function updateEducation() {
        const college =
            document.getElementById("college");

        const degree =
            document.getElementById("degree");

        const branch =
            document.getElementById("branch");

        const cgpa =
            document.getElementById("cgpa");

        const gradYear =
            document.getElementById("gradYear");

        const previewCollege =
            document.getElementById("previewCollege");

        const previewEducation =
            document.getElementById("previewEducation");

        if (
            !college ||
            !degree ||
            !branch ||
            !cgpa ||
            !gradYear ||
            !previewCollege ||
            !previewEducation
        ) {
            console.error("Education elements missing");
            return;
        }

        previewCollege.textContent =
            college.value.trim() || "College Name";

        const details = [
            degree.value.trim(),
            branch.value.trim(),
            cgpa.value.trim()
                ? "CGPA: " + cgpa.value.trim()
                : "",
            gradYear.value.trim()
        ]
        .filter(Boolean)
        .join(" • ");

        previewEducation.textContent =
            details ||
            "Degree • Branch • CGPA • Graduation Year";
    }

    educationFields.forEach(function (fieldId) {
        const field = document.getElementById(fieldId);

        if (field) {
            field.addEventListener(
                "input",
                updateEducation
            );
        }
    });


    // SKILLS

    const skills =
        document.getElementById("skills");

    const previewSkills =
        document.getElementById("previewSkills");

    if (skills && previewSkills) {

        skills.addEventListener(
            "input",
            function () {

                const skillList = this.value
                    .split(",")
                    .map(skill => skill.trim())
                    .filter(Boolean);

                previewSkills.textContent =
                    skillList.length > 0
                        ? skillList.join(" • ")
                        : "Your skills will appear here.";
            }
        );

    }


    // PROJECT

    connectInput(
        "projectName",
        "previewProjectName",
        "Project Name"
    );

    connectInput(
        "projectTech",
        "previewProjectTech",
        ""
    );

    connectInput(
        "projectDescription",
        "previewProjectDescription",
        "Your project description will appear here."
    );


    console.log(
        "ResumeAI Builder JavaScript Loaded Successfully"
    );

});


function downloadResume() {
    window.print();
}