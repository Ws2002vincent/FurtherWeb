$(document).ready(function() {
    $('#email').on('input', function() {
        var email = $(this).val();
        if (email.length > 0) {
            $.ajax({
                url: '/checkEmail',
                type: 'POST',
                data: { email: email },
                success: function(response) {
                    if (response.available) {
                        $('#emailFeedback').text('Email is available').css('color', 'green').prop('disabled', false);
                    } else {
                        $('#emailFeedback').text('Email is taken').css('color', 'red').prop('disabled', true);
                    }
                },
                error: function() {
                    $('#emailFeedback').text('Error checking email').css('color', 'red').prop('disabled', true);
                }
            });
        } else {
            $('#emailFeedback').text('');
        }
    });
});