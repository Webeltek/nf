from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField, EmailField
from wtforms.validators import DataRequired, Length, Email, Regexp, EqualTo
from wtforms import ValidationError
from ..models_al import User


class LoginForm(FlaskForm):
    email = EmailField('E-postadresse', validators=[DataRequired(), Length(4, 64),Email(message='feil format',check_deliverability=True)])
    password = PasswordField('Passord', validators=[DataRequired()])
    remember_me = BooleanField('La meg være pålogget')
    submit = SubmitField('Logg Inn')

def validate_email(form, field):
        if User.select().where(User.user_email == field.data.lower()):
            raise ValidationError('E-postadressen er allerede i bruk.')

class RegistrationForm(FlaskForm):
    email = EmailField('E-postadresse', validators=[DataRequired(), Length(4, 64),Email(), validate_email])
    password = PasswordField('Passord', validators=[DataRequired(),
        Length(8,64,message='Passord må være minst 8 tegn!'), 
        EqualTo('password2', message='Passordene må være like!')])
    password2 = PasswordField('Gjenta passord', validators=[DataRequired()])
    submit = SubmitField('Registrer')


class PasswordResetRequestForm(FlaskForm):
    email = StringField('E-postadresse', validators=[DataRequired(), Length(1, 64), Email()])
    submit = SubmitField('Send')


class PasswordResetForm(FlaskForm):
    password = PasswordField('Nytt passord', 
            validators=[ Length(8,64,message='Passord må være minst 8 tegn!'),
      DataRequired(), EqualTo('password2', message='Passordene må være like!')])
    password2 = PasswordField('Bekreft passord', validators=[DataRequired()])
    submit = SubmitField('Tilbakestill passord')

class ChangePasswordForm(FlaskForm):
    old_password = PasswordField('Gammelt passord', validators=[DataRequired()])
    password = PasswordField('Nytt passord', validators=[
        DataRequired(), EqualTo('password2', message='Passordene må være like!')])
    password2 = PasswordField('Bekreft nytt passord',
                              validators=[DataRequired()])
    submit = SubmitField('Lagre passord')

class ChangeEmailForm(FlaskForm):
    email = StringField('Ny epost', validators=[DataRequired(), Length(1, 64),
                                                 Email()])
    password = PasswordField('Passord', validators=[DataRequired()])
    submit = SubmitField('Oppdater epost')

    def validate_email(self, field):
        if User.select().where(User.user_email==field.data.lower()):
            raise ValidationError('Epost allerede i bruk.')    
