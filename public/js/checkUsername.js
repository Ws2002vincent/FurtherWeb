$(document).ready(function() {
    let usernameValid = false;
    let emailValid = true; // Will be managed by checkEmail.js

    function updateRegisterButton() {
        $('#registerBtn').prop('disabled', !(usernameValid && emailValid));
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
                        usernameValid = true;
                    } else {
                        $('#usernameFeedback').text('Username is taken').css('color', 'red');
                        usernameValid = false;
                    }
                    updateRegisterButton();
                },
                error: function(xhr, status, error) {
                    console.error('Error:', error);
                    $('#usernameFeedback').text('Error checking username').css('color', 'red');
                    usernameValid = false;
                    updateRegisterButton();
                }
            });
        } else {
            $('#usernameFeedback').text('');
            usernameValid = false;
            updateRegisterButton();
        }
    });

    // Make emailValid accessible to checkEmail.js
    window.updateEmailValid = function(valid) {
        emailValid = valid;
        updateRegisterButton();
    };
});