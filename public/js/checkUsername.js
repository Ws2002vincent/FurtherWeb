$(document).ready(function() {
    $('#username').on('input', function() {
        var username = $(this).val();
        if (username.length > 0) {
            $.ajax({
                url: '/checkUsername',
                type: 'POST',
                data: { username: username },
                success: function(response) {
                    if (response.available) {
                        $('#usernameFeedback').text('Username is available').css('color', 'green').prop('disabled', false);
                    } else {
                        $('#usernameFeedback').text('Username is taken').css('color', 'red').prop('disabled', true);
                    }
                },
                error: function() {
                    $('#usernameFeedback').text('Error checking username').css('color', 'red').prop('disabled', true);
                }
            });
        } else {
            $('#usernameFeedback').text('');
        }
    });
});