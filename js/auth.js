// Authentication Logic for VMAX VPN 

// Wait for Firebase to load
document.addEventListener('DOMContentLoaded', () => {

    // --- Registration Logic ---
    const registerForm = document.getElementById('form-email');
    if (registerForm && window.location.pathname.includes('register.html')) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Note: Since we haven't added specific IDs to the inputs yet, 
            // we will grab them by placeholder or type for now, or you can add IDs to the HTML.
            const inputs = registerForm.querySelectorAll('input');
            const fullName = inputs[0].value;
            const dob = inputs[1].value;
            const mobile = inputs[2].value;
            const email = inputs[3].value;
            const password = inputs[4].value;

            try {
                // 1. Create user in Firebase Authentication
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // 2. Save additional user details in Firestore Database
                await db.collection("users").doc(user.uid).set({
                    fullName: fullName,
                    dob: dob,
                    mobile: mobile,
                    email: email,
                    role: "user", // default role
                    status: "Active",
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert("Registration Successful! Please log in.");
                window.location.href = "login.html";

            } catch (error) {
                console.error("Registration Error:", error);
                alert("Error: " + error.message);
            }
        });
    }

    // --- Mobile Registration Logic (Phone Auth) ---
    const mobileForm = document.getElementById('form-mobile');
    const sendPinBtn = document.getElementById('send-pin-btn');

    if (mobileForm && window.location.pathname.includes('register.html')) {
        // Handle Send PIN button
        if (sendPinBtn) {
            sendPinBtn.addEventListener('click', () => {
                const codeNode = document.getElementById('mobile-code');
                const numberNode = document.getElementById('mobile-number');
                const phoneNumber = codeNode.value + numberNode.value.replace(/\s+/g, '');

                if (!numberNode.value) {
                    alert("Please enter your mobile number first.");
                    return;
                }

                // Initialize reCAPTCHA if not already initialized
                if (!window.recaptchaVerifier) {
                    window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
                        'size': 'invisible',
                    });
                }

                sendPinBtn.disabled = true;
                sendPinBtn.innerText = 'Sending...';

                const appVerifier = window.recaptchaVerifier;
                auth.signInWithPhoneNumber(phoneNumber, appVerifier)
                    .then((confirmationResult) => {
                        window.confirmationResult = confirmationResult;
                        alert("OTP has been sent to " + phoneNumber);
                        sendPinBtn.innerText = 'Sent \u2713';
                    }).catch((error) => {
                        console.error("SMS Not Sent", error);
                        alert("Error sending SMS: " + error.message);
                        sendPinBtn.disabled = false;
                        sendPinBtn.innerText = 'Send PIN';
                        // Reset reCaptcha
                        if (window.recaptchaVerifier) {
                            window.recaptchaVerifier.render().then(function (widgetId) {
                                window.grecaptcha.reset(widgetId);
                            });
                        }
                    });
            });
        }

        // Handle Mobile Form Verification
        mobileForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const otpInput = document.getElementById('otp-input').value;
            if (!otpInput) {
                alert("Please enter the OTP code.");
                return;
            }
            if (!window.confirmationResult) {
                alert("Please request an OTP code first.");
                return;
            }

            try {
                // Verify OTP
                const result = await window.confirmationResult.confirm(otpInput);
                const user = result.user;

                // Extract fields
                const inputs = mobileForm.querySelectorAll('input');
                const fullName = inputs[0].value;
                const dob = inputs[1].value;
                const email = inputs[2].value; // Backup email
                const codeNode = document.getElementById('mobile-code');
                const numberNode = document.getElementById('mobile-number');
                const mobile = codeNode.value + numberNode.value.replace(/\s+/g, '');

                // Save user details to Firestore
                await db.collection("users").doc(user.uid).set({
                    fullName: fullName,
                    dob: dob,
                    mobile: mobile,
                    email: email,
                    role: "user",
                    status: "Active",
                    authProvider: "phone",
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });

                alert("Mobile Registration Successful! Welcome.");
                window.location.href = "login.html"; // Redirect to login or index

            } catch (error) {
                console.error("OTP Verification Error:", error);
                alert("Invalid OTP code. Please try again.");
            }
        });
    }

    // --- Login Logic ---
    const loginForm = document.getElementById('form-email');
    if (loginForm && window.location.pathname.includes('login.html')) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const inputs = loginForm.querySelectorAll('input');
            const email = inputs[0].value;
            const password = inputs[1].value;

            try {
                // Sign in user
                const userCredential = await auth.signInWithEmailAndPassword(email, password);

                // Let's check user role from Firestore before redirecting
                const doc = await db.collection("users").doc(userCredential.user.uid).get();
                if (doc.exists) {
                    const userData = doc.data();
                    if (userData.role === "admin") {
                        window.location.href = "admin.html";
                    } else {
                        // Regular user redirect (E.g. user-dashboard.html, but we will send them to home for now)
                        alert("Login Successful! Welcome back.");
                        window.location.href = "index.html";
                    }
                } else {
                    // No user data found but auth successful
                    window.location.href = "index.html";
                }

            } catch (error) {
                console.error("Login Error:", error);
                alert("Error: " + error.message);
            }
        });
    }

    // --- Auth State Observer (Optional: secure the Admin page) ---
    if (window.location.pathname.includes('admin.html')) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                // User is signed in, check if they are admin
                db.collection("users").doc(user.uid).get().then((doc) => {
                    if (!doc.exists || doc.data().role !== "admin") {
                        // Not an admin
                        alert("Access Denied: You do not have admin privileges.");
                        window.location.href = "index.html";
                    }
                });
            } else {
                // No user is signed in
                window.location.href = "login.html";
            }
        });
    }
});
