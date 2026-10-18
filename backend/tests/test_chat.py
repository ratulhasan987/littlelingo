from django.test import TestCase, override_settings
from rest_framework.test import APIClient
from learning.models import Learner
from learning.engine import classify
class LearningTests(TestCase):
    def setUp(self):self.client=APIClient()
    def send(self,message,learner_id=None):return self.client.post('/api/chat/',{'message':message,**({'learner_id':learner_id} if learner_id else {})},format='json')
    def test_initial_question_and_correct_answer(self):
        result=self.send('start').json()
        self.assertEqual(result['level'],1)
        self.assertIn('meow',result['reply'])
        correct=self.send('cat',result['learner_id']).json()
        self.assertTrue(correct['correct'])
        self.assertEqual(correct['ui']['type'],'success')
    def test_mode_and_safety(self):
        self.assertEqual(classify('I am sad')[0],'support')
        self.assertEqual(classify('I am bored')[0],'engagement')
        out=self.send('my phone number is 123').json()
        self.assertIn('private',out['reply'])
        self.assertEqual(out['ui']['type'],'support')
        self.assertNotIn('💛',out['reply'])
    def test_no_punishment_for_wrong_answers(self):
        first=self.send('start').json()
        second=self.send('banana',first['learner_id']).json()
        self.assertFalse(second['correct'])
        self.assertIn('Good try',second['reply'])
    def test_two_correct_answers_master_word(self):
        first=self.send('start').json(); sid=first['learner_id']
        self.send('cat',sid)
        self.send('start',sid)
        self.send('cat',sid)
        progress=self.client.get('/api/progress/'+sid+'/').json()
        self.assertTrue(next(x for x in progress['words'] if x['word']=='cat')['mastered'])
    def test_bad_inputs(self):
        self.assertEqual(self.send('').status_code,400)
        self.assertEqual(self.send('hello','bad-uuid').status_code,400)
