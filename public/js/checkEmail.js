$(document).ready(function() {
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
                        window.updateEmailValid(true);
                    } else {
                        $('#emailFeedback').text('Email is taken').css('color', 'red');
                        window.updateEmailValid(false);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error:', error);
                    $('#emailFeedback').text('Error checking email').css('color', 'red');
                    window.updateEmailValid(false);
                }
            });
        } else {
            $('#emailFeedback').text('');
            window.updateEmailValid(false);
        }
    });
});