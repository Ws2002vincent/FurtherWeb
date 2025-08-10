$(document).ready(function() {
    window.usernameValid = false;  // Make it global

    function updateRegisterButton() {
        const emailValid = window.emailValid || false;
        const passwordValid = window.passwordValid || false;
        $('#registerBtn').prop('disabled', !(window.usernameValid && emailValid && passwordValid));
    }

    $('#username').on('input', function() {
        var username = $(this).val();
        if (username.length > 0) {
            $.ajax({
                url: '/username',
                type: 'POST',
                data: { username: username },
                success: function(response) {
                    if (response.available) {
                        $('#usernameFeedback').text('Username is available').css('color', 'green');
                        window.usernameValid = true;
                    } else {
                        $('#usernameFeedback').text('Username is taken').css('color', 'red');
                        window.usernameValid = false;
                    }
                    updateRegisterButton();
                },
                error: function(xhr, status, error) {
                    console.error('Error:', error);
                    $('#usernameFeedback').text('Error checking username').css('color', 'red');
                    window.usernameValid = false;
                    updateRegisterButton();
                }
            });
        } else {
            $('#usernameFeedback').text('');
            window.usernameValid = false;
            updateRegisterButton();
        }
    });

    // Make emailValid accessible to checkEmail.js
    window.updateEmailValid = function(valid) {
        emailValid = valid;
        updateRegisterButton();
    };
});