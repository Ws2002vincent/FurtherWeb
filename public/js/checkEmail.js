$(document).ready(function() {
    window.emailValid = false;  // Make it global

    $('#email').on('input', function() {
        var email = $(this).val();
        if (email.length > 0) {
            $.ajax({
                url: '/email',
                type: 'POST',
                data: { email: email },
                success: function(response) {
                    if (response.available) {
                        $('#emailFeedback').text('Email is available').css('color', 'green');
                        window.emailValid = true;
                    } else {
                        $('#emailFeedback').text('Email is taken').css('color', 'red');
                        window.emailValid = false;
                    }
                    updateRegisterButton();
                },
                error: function(xhr, status, error) {
                    console.error('Error:', error);
                    $('#emailFeedback').text('Error checking email').css('color', 'red');
                    window.emailValid = false;
                    updateRegisterButton();
                }
            });
        } else {
            $('#emailFeedback').text('');
            window.emailValid = false;
            updateRegisterButton();
        }
    });
    
    function updateRegisterButton() {
        const usernameValid = window.usernameValid || false;
        const passwordValid = window.passwordValid || false;
        $('#registerBtn').prop('disabled', !(usernameValid && window.emailValid && passwordValid));
    }
});